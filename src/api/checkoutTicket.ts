import { getLineIdToken } from "@/contexts/LiffContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface InvoiceExisting {
  used: boolean;
  usedAt?: string;
  userId?: string;
  displayName?: string | null;
  tableId?: string | null;
  restaurantId?: string | null;
  amountTotal?: number;
  diceIssued?: number;
  source?: "e_invoice" | "pos_slip" | "checkout_qr";
}

export type TicketSource = "checkout" | "room_charge";

export interface IssueResponse {
  ok: boolean;
  reason?: string;
  token?: string;
  dice_to_issue?: number;
  amount?: number;
  expires_at?: string;
  source?: TicketSource;
  existing?: InvoiceExisting;  // populated when reason === "invoice_already_used"
}

export async function issueCheckoutTicket(
  amount: number,
  pin: string,
  invoiceNo: string | null,
  restaurantId?: string | null,
  source: TicketSource = "checkout",
): Promise<IssueResponse> {
  const res = await fetch(`${API_BASE}/api/checkout-ticket/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Staff-Pin": pin,
    },
    body: JSON.stringify({
      amount,
      invoice_no: source === "room_charge" ? null : invoiceNo,
      restaurant_id: restaurantId ?? null,
      source,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok === true, ...data };
}

export interface RedeemResponse {
  ok: boolean;
  reason?: string;
  dice_issued?: number;
  amount?: number;
  restaurant_id?: string | null;
}

export async function redeemCheckoutTicket(token: string): Promise<RedeemResponse> {
  const idToken = getLineIdToken();
  const res = await fetch(`${API_BASE}/api/checkout-ticket/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ token }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok === true, ...data };
}
