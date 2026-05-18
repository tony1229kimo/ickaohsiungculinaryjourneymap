import { getLineIdToken } from "@/contexts/LiffContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface BindRestaurantResponse {
  ok: boolean;
  reason?: string;
  restaurant?: string;
  table_id?: string;
}

export async function bindRestaurant(code: string): Promise<BindRestaurantResponse> {
  const token = getLineIdToken();
  const res = await fetch(`${API_BASE}/api/bind/restaurant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ code }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok === true, ...data };
}
