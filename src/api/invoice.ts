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
    | "binding_already_used"
    | "image_required"
    | "image_too_large"
    | "vision_unavailable"
    | "vision_error"
    | "low_confidence"
    | "not_ic_kaohsiung"
    | "not_a_receipt";
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

/**
 * 載具客 (carrier-bound) flow — POST a photo of the POS receipt slip.
 * Backend runs OpenAI vision OCR + the same triple-lock as the QR path.
 */
export async function redeemReceiptImage(imageBase64DataUrl: string): Promise<InvoiceRedeemResponse> {
  const token = getLineIdToken();
  const res = await fetch(`${API_BASE}/api/invoice/redeem-receipt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ image_base64: imageBase64DataUrl }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok === true, ...data };
}
