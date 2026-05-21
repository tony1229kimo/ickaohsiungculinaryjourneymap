import { getLineIdToken } from "@/contexts/LiffContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getLineIdToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

/**
 * Sentinel error message used by AdminCustomersPage to render the
 * "🔄 重新登入" UI. Tony 2026-05-21: LIFF id_token has ~1h TTL and
 * `liff.getIDToken()` does NOT auto-refresh — staff who leave the
 * dashboard tab open for an hour will hit "IdToken expired." 401.
 */
export const ERR_TOKEN_EXPIRED = "LIFF_TOKEN_EXPIRED";

/**
 * fetch wrapper that auto-detects expired LIFF id_token and throws a
 * dedicated error the UI can surface. We deliberately do NOT call
 * `liff.login()` here — the UI shows a button so the user understands
 * the redirect that's about to happen.
 */
async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: { ...(init.headers ?? {}), ...authHeaders() },
  });
  if (res.status === 401) {
    let detail: string | undefined;
    try {
      const body = await res.clone().json();
      detail = (body as { detail?: string })?.detail;
    } catch { /* not json — ignore */ }
    if (detail === "IdToken expired.") {
      throw new Error(ERR_TOKEN_EXPIRED);
    }
  }
  return res;
}

export interface CustomerProfile {
  user_id: string;
  display_name: string | null;
  picture_url: string | null;
  first_seen_at: string;
  last_seen_at: string;
  total_visits: number;
  total_spend: number;
  total_dice_rolled: number;
  total_rewards_earned: number;
  total_seasons: number;
}

export interface CustomersListResp {
  total: number;
  limit: number;
  offset: number;
  customers: CustomerProfile[];
}

export type SortField = "last_seen_at" | "first_seen_at" | "total_spend" | "total_visits" | "total_dice_rolled" | "total_rewards_earned" | "total_seasons";

export async function listCustomers(opts: {
  sort?: SortField;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
  search?: string;
  restaurant?: string;
} = {}): Promise<CustomersListResp> {
  const q = new URLSearchParams();
  if (opts.sort) q.set("sort", opts.sort);
  if (opts.order) q.set("order", opts.order);
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  if (opts.search) q.set("search", opts.search);
  if (opts.restaurant) q.set("restaurant", opts.restaurant);
  const res = await authFetch(`${API_BASE}/api/admin/customers?${q}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface CustomerEvent {
  id: number;
  event_type: string;
  restaurant_id: string | null;
  amount: number | null;
  payload: unknown;
  created_at: string;
}

export interface CustomerDetail {
  profile: CustomerProfile;
  events: CustomerEvent[];
  game_state: { total_points: number; claimed_tiles: number[]; earned_rewards: unknown[]; updated_at: string } | null;
}

export async function getCustomer(userId: string): Promise<CustomerDetail> {
  const res = await authFetch(`${API_BASE}/api/admin/customers/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface StatsOverview {
  summary: {
    total_customers: number;
    active_7d: number;
    active_30d: number;
    has_visited: number;
    has_rewarded: number;
    bound_to_restaurant: number;
    total_spend: number;
    total_rolls: number;
    total_rewards: number;
  };
  by_restaurant: Array<{
    restaurant_id: string;
    name_zh: string;
    name_en: string;
    unique_visitors: number;
    binds: number;
    redeems: number;
    rolls: number;
    rewards: number;
    spend: number;
  }>;
}

export async function getStats(): Promise<StatsOverview> {
  const res = await authFetch(`${API_BASE}/api/admin/customers/_stats/overview`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getCsvExportUrl(): string {
  // CSV download uses Authorization header; can't bare-link from <a>.
  // Caller should fetch() the URL with authHeaders and create a blob.
  return `${API_BASE}/api/admin/customers/export.csv`;
}

export async function downloadCsv(): Promise<void> {
  const res = await authFetch(getCsvExportUrl());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ic-kaohsiung-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
