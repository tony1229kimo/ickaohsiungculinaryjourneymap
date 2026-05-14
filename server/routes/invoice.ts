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
import { redeemInvoice } from "../db.js";

const router = Router();

router.post("/redeem", requireLiffAuth(), async (req: Request, res: Response) => {
  const userId = (req as Request & { lineUserId?: string }).lineUserId;
  if (!userId) return res.status(401).json({ ok: false, reason: "no_user" });

  const raw = (req.body?.qr as string | undefined)?.trim();
  if (!raw) {
    return res.status(400).json({ ok: false, reason: "qr_required" });
  }

  const result = await redeemInvoice(userId, raw);
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
    result.reason === "no_active_binding" ? 412 :
    result.reason === "amount_below_threshold" ? 400 :
    422; // parse_failed
  return res.status(httpStatus).json({ ok: false, reason: result.reason, amount: result.amount });
});

export default router;
