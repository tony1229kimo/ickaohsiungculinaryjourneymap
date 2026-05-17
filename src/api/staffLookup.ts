const API_BASE = import.meta.env.VITE_API_URL || "";

export interface InvoiceLookupResponse {
  ok: boolean;
  reason?: string;
  invoiceNo?: string;
  used?: boolean;
  usedAt?: string;
  userId?: string;
  displayName?: string | null;
  tableId?: string | null;
  restaurantId?: string | null;
  amountTotal?: number;
  diceIssued?: number;
  source?: "e_invoice" | "pos_slip" | "checkout_qr";
  pendingTicket?: { token: string; expiresAt: string; amount: number };
}

export async function lookupInvoice(invoiceNo: string, pin: string): Promise<InvoiceLookupResponse> {
  const url = new URL(`${API_BASE}/api/staff/lookup`, window.location.origin);
  url.searchParams.set("invoice_no", invoiceNo);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "X-Staff-Pin": pin },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, reason: data.reason ?? "request_failed" };
  // Normalize keys to camelCase from server's mixed shape
  return {
    ok: true,
    invoiceNo: data.invoiceNo,
    used: data.used,
    usedAt: data.usedAt,
    userId: data.userId,
    displayName: data.displayName,
    tableId: data.tableId,
    restaurantId: data.restaurantId,
    amountTotal: data.amountTotal,
    diceIssued: data.diceIssued,
    source: data.source,
    pendingTicket: data.pendingTicket,
  };
}
