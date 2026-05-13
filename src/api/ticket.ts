import { getLineIdToken } from "@/contexts/LiffContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface RedeemResult {
  ok: boolean;
  reason?: "unknown" | "expired" | "already_redeemed" | "rejected";
}

export async function redeemTicket(ticket: string): Promise<RedeemResult> {
  const token = getLineIdToken();
  const res = await fetch(`${API_BASE}/api/ticket/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ticket }),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<RedeemResult>;
  if (res.ok && data.ok) return { ok: true };
  return { ok: false, reason: data.reason ?? "rejected" };
}
