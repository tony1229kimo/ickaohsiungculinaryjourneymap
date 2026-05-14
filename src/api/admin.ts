/**
 * Staff admin API client. All endpoints require LIFF id_token AND being on
 * the staff_whitelist on the backend (server/db.ts:isStaff).
 *
 * See server/routes/tableAdmin.ts for the matching server side.
 */

import { getLineIdToken } from "@/contexts/LiffContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getLineIdToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export interface Restaurant {
  id: string;          // 'ZL' / 'WR' / 'SD' / 'HW' / 'BL'
  hotel_id: string;    // 'KH'
  code: string;        // 'ZHAN-LU'
  name_zh: string;
  name_en: string;
}

export interface TableRow {
  id: string;          // 'ZL05'
  label: string;       // '05'
  state: "idle" | "bound" | "activated" | "cooldown";
  binding: {
    user_id: string;
    bound_at: string;
  } | null;
}

export async function listRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${API_BASE}/api/admin/restaurants`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.restaurants ?? [];
}

export async function listTables(restaurantId: string): Promise<TableRow[]> {
  const res = await fetch(
    `${API_BASE}/api/admin/restaurants/${encodeURIComponent(restaurantId)}/tables`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.tables ?? [];
}

export interface ActivateResponse {
  ok: boolean;
  reason?: "table_not_found" | "no_active_binding" | string;
  table_id?: string;
  dice_issued?: number;
  customer_user_id?: string;
  push_ok?: boolean;
  push_reason?: string;
}

export async function activateTable(tableId: string, amount: number): Promise<ActivateResponse> {
  const res = await fetch(
    `${API_BASE}/api/admin/tables/${encodeURIComponent(tableId)}/activate`,
    {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ amount }),
    },
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok === true, ...data };
}

export async function cancelTable(tableId: string): Promise<{ ok: boolean }> {
  const res = await fetch(
    `${API_BASE}/api/admin/tables/${encodeURIComponent(tableId)}/cancel`,
    { method: "POST", headers: authHeaders() },
  );
  return { ok: res.ok };
}
