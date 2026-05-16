import { getLineIdToken } from "@/contexts/LiffContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface InvoiceRedeemResponse {
  ok: boolean;
  dice_issued?: number;
  amount?: number;
  restaurant_id?: string;
  reason?:
    | "already_redeemed"
    | "no_active_binding"
    | "amount_below_threshold"
    | "parse_failed"
    | "qr_required"
    | "no_user"
    | "server_error"
    | "wrong_seller"
    | "stale_invoice"
    | "binding_already_used";
  error?: string;  // populated on server_error
}

export async function redeemInvoice(rawQR: string): Promise<InvoiceRedeemResponse> {
  const token = getLineIdToken();
  const res = await fetch(`${API_BASE}/api/invoice/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ qr: rawQR }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok === true, ...data };
}
