import { getLineIdToken } from "@/contexts/LiffContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getLineIdToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
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
} = {}): Promise<CustomersListResp> {
  const q = new URLSearchParams();
  if (opts.sort) q.set("sort", opts.sort);
  if (opts.order) q.set("order", opts.order);
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  if (opts.search) q.set("search", opts.search);
  const res = await fetch(`${API_BASE}/api/admin/customers?${q}`, { headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/api/admin/customers/${encodeURIComponent(userId)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface StatsOverview {
  summary: {
    total_customers: number;
    active_7d: number;
    active_30d: number;
    has_visited: number;
    total_spend: number;
    total_rolls: number;
    total_rewards: number;
  };
  by_restaurant: Array<{
    restaurant_id: string;
    unique_visitors: number;
    visits: number;
    spend: number;
  }>;
}

export async function getStats(): Promise<StatsOverview> {
  const res = await fetch(`${API_BASE}/api/admin/customers/_stats/overview`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getCsvExportUrl(): string {
  // CSV download uses Authorization header; can't bare-link from <a>.
  // Caller should fetch() the URL with authHeaders and create a blob.
  return `${API_BASE}/api/admin/customers/export.csv`;
}

export async function downloadCsv(): Promise<void> {
  const res = await fetch(getCsvExportUrl(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ic-kaohsiung-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
