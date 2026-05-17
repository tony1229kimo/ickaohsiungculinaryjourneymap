/**
 * Staff customer-complaint lookup tool (Phase 8.3, Tony 2026-05-17).
 *
 * Use case:
 *   Customer: "我這張發票明明沒用過,為什麼系統說已使用?"
 *   Service staff opens /admin/lookup, types the BM-XXXXXXXX from the slip,
 *   gets back: was it used? when? by which LINE user? at which table?
 *   Staff shows the screen to the customer — case closed.
 *
 * Auth: same numeric PIN as /admin/checkout. Service staff already know it.
 */

import { Router, type Request, type Response } from "express";
import { lookupInvoice } from "../db.js";
import { requireStaffPin } from "./checkoutTicket.js";

const router = Router();

router.get("/lookup", requireStaffPin, async (req: Request, res: Response) => {
  try {
    const raw = (req.query.invoice_no as string | undefined)?.trim();
    if (!raw) {
      return res.status(400).json({ ok: false, reason: "invoice_required" });
    }
    if (!/^[A-Za-z]{2}-?\d{8}$/.test(raw)) {
      return res.status(400).json({ ok: false, reason: "invoice_format_invalid" });
    }
    const result = await lookupInvoice(raw);
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[staff-lookup] failed:", err);
    return res.status(500).json({ ok: false, reason: "server_error" });
  }
});

export default router;
