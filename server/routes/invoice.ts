/**
 * Invoice redeem endpoint — Phase 5.
 *
 * Flow:
 *   Customer scans table QR → joins LINE OA, binds to table A05
 *   Customer dines, gets paper invoice
 *   Customer in LIFF taps "掃發票拿擲骰"
 *   Frontend decodes left QR via html5-qrcode, POSTs the raw string here
 *   We:
 *     - parse the QR (see db.ts:parseInvoiceQR)
 *     - look up an active table binding (must be ≤60 min old)
 *     - dedup by invoice_no PK
 *     - issue dice_pool row + customer_events row
 *
 * Anti-fraud relies on physical presence (table QR is only at IC restaurants)
 * + 60-min binding window — we deliberately do NOT verify seller_vat per
 * Tony's call 2026-05-14 to keep onboarding fast.
 *
 * Loadbearing security: ONLY LIFF-authenticated requests reach here, so the
 * user_id we redeem against is the verified LINE userId.
 */

import { Router, type Request, type Response } from "express";
import { requireLiffAuth } from "../middleware/liffAuth.js";
import { redeemInvoice, redeemReceiptImage } from "../db.js";
import { analyzeReceipt } from "../lib/receiptVision.js";

const router = Router();

router.post("/redeem", requireLiffAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { lineUserId?: string }).lineUserId;
    if (!userId) return res.status(401).json({ ok: false, reason: "no_user" });

    const raw = (req.body?.qr as string | undefined)?.trim();
    if (!raw) {
      return res.status(400).json({ ok: false, reason: "qr_required" });
    }

    console.log(`[invoice/redeem] user=${userId} raw_len=${raw.length} raw_head=${raw.slice(0, 20)}`);
    const result = await redeemInvoice(userId, raw);
    console.log(`[invoice/redeem] result=${JSON.stringify(result)}`);

    if (result.ok) {
      return res.json({
        ok: true,
        dice_issued: result.diceIssued,
        amount: result.amount,
        restaurant_id: result.restaurantId,
      });
    }

    const httpStatus =
      result.reason === "already_redeemed" ? 409 :
      result.reason === "binding_already_used" ? 409 :
      result.reason === "no_active_binding" ? 412 :
      result.reason === "amount_below_threshold" ? 400 :
      result.reason === "wrong_seller" ? 403 :
      result.reason === "stale_invoice" ? 410 :
      422; // parse_failed
    return res.status(httpStatus).json({ ok: false, reason: result.reason, amount: result.amount });
  } catch (err) {
    // Catch-all so the client never sees an empty 500 ("未知") response.
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[invoice/redeem] uncaught exception:", err);
    return res.status(500).json({ ok: false, reason: "server_error", error: errMsg.slice(0, 300) });
  }
});

/**
 * Receipt-image redeem (Phase 8.1, Tony 2026-05-15) — for 載具客 who don't
 * get a 電子發票證明聯, only the POS "small white slip" with no QR.
 *
 * Body: { image_base64: "data:image/jpeg;base64,..." }
 *
 * We:
 *   1. Call OpenAI gpt-4o-mini vision to extract (invoice_no, total, date,
 *      is_ic_kaohsiung). Vision IS the "this is a real IC slip" check —
 *      slip has no QR / sellerVat / signature, so visual brand identification
 *      is our only fingerprint.
 *   2. Apply triple-lock minus seller_vat (db.ts:redeemReceiptImage).
 *   3. Reuse invoices.invoice_no PK for global dedup.
 */
router.post("/redeem-receipt", requireLiffAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { lineUserId?: string }).lineUserId;
    if (!userId) return res.status(401).json({ ok: false, reason: "no_user" });

    const imageBase64 = req.body?.image_base64 as string | undefined;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ ok: false, reason: "image_required" });
    }
    if (!imageBase64.startsWith("data:image/")) {
      return res.status(400).json({ ok: false, reason: "image_required" });
    }

    console.log(`[invoice/redeem-receipt] user=${userId} bytes=${imageBase64.length}`);
    const vision = await analyzeReceipt(imageBase64);
    console.log(`[invoice/redeem-receipt] vision=${JSON.stringify({
      ok: vision.ok, reason: vision.reason, isIc: vision.isIcKaohsiung,
      invoiceNo: vision.invoiceNo, amount: vision.totalAmount, date: vision.dateIso,
      conf: vision.confidence,
    })}`);

    if (!vision.ok) {
      const status =
        vision.reason === "image_too_large" ? 413 :
        vision.reason === "vision_unavailable" ? 503 :
        vision.reason === "not_ic_kaohsiung" ? 403 :
        vision.reason === "not_a_receipt" ? 422 :
        vision.reason === "low_confidence" ? 422 :
        500;
      return res.status(status).json({ ok: false, reason: vision.reason });
    }

    if (!vision.invoiceNo || !vision.totalAmount || !vision.dateIso) {
      return res.status(422).json({ ok: false, reason: "low_confidence" });
    }

    const result = await redeemReceiptImage(userId, {
      invoiceNo: vision.invoiceNo.toUpperCase(),
      totalAmount: vision.totalAmount,
      dateIso: vision.dateIso,
      restaurantName: vision.restaurantName,
    });
    console.log(`[invoice/redeem-receipt] db_result=${JSON.stringify(result)}`);

    if (result.ok) {
      return res.json({
        ok: true,
        dice_issued: result.diceIssued,
        amount: result.amount,
        restaurant_id: result.restaurantId,
      });
    }
    const httpStatus =
      result.reason === "already_redeemed" ? 409 :
      result.reason === "binding_already_used" ? 409 :
      result.reason === "no_active_binding" ? 412 :
      result.reason === "amount_below_threshold" ? 400 :
      result.reason === "stale_invoice" ? 410 :
      422;
    return res.status(httpStatus).json({ ok: false, reason: result.reason, amount: result.amount });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[invoice/redeem-receipt] uncaught:", err);
    return res.status(500).json({ ok: false, reason: "server_error", error: errMsg.slice(0, 300) });
  }
});

export default router;
