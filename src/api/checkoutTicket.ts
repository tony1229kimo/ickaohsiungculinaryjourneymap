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
  detail?: string;
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

// ─────────────────────────────────────────────────────────────────
// Tony 2026-05-23: staff-facing 補發優惠券 helpers — same /admin/checkout
// PIN gate, no LIFF required. Mirrors the admin dashboard counterparts in
// api/customers.ts but with PIN auth.
// ─────────────────────────────────────────────────────────────────

export interface StaffRewardEntry {
  id: string;
  source: "fixed_tile" | "lottery_chance" | "lottery_fate";
  tile?: number;
  name: string;
  shortName: string;
}

export async function listStaffRewards(pin: string): Promise<{ ok: boolean; rewards?: StaffRewardEntry[]; reason?: string }> {
  const res = await fetch(`${API_BASE}/api/checkout-ticket/rewards`, {
    headers: { "X-Staff-Pin": pin },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, ...data };
}

export interface RecentCustomer {
  user_id: string;
  display_name: string | null;
  last_seen_at: string;
  total_visits: number;
  total_spend: number;
}

export async function listRecentCustomers(pin: string, q?: string): Promise<{ ok: boolean; customers?: RecentCustomer[]; reason?: string }> {
  const res = await fetch(`${API_BASE}/api/checkout-ticket/recent-customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Staff-Pin": pin },
    body: JSON.stringify({ q: q ?? "" }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, ...data };
}

export async function staffGrantReward(
  pin: string,
  userId: string,
  rewardId: string,
  note?: string,
): Promise<{ ok: boolean; customer_name?: string | null; reward?: { id: string; name: string }; push_ok?: boolean; push_reason?: string | null; reason?: string }> {
  const res = await fetch(`${API_BASE}/api/checkout-ticket/grant-reward`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Staff-Pin": pin },
    body: JSON.stringify({ user_id: userId, reward_id: rewardId, note }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok === true, ...data };
}
