/**
 * Checkout-QR ticket endpoints (Phase 8 — two-QR redesign).
 *
 * The "checkout QR" replaces the older /admin/tables activation flow:
 *
 *   Staff in /admin/checkout enters consumption amount + numeric password
 *   POST /api/checkout-ticket/issue → returns { token, expires_at, dice }
 *   Page renders the QR pointing to https://<game>/?ticket=<token>
 *   Customer scans (LINE camera or in-app QR scanner) → lands in LIFF
 *   POST /api/checkout-ticket/redeem (LIFF auth) → dice_pool grows
 *
 * Security model:
 *   - Issue is gated by STAFF_NUMERIC_PASSWORD (env var) — no LIFF needed,
 *     so staff phones don't need to "login" to the app each shift. Anyone
 *     who knows the daily PIN can issue.
 *   - Redeem is LIFF-auth gated. Tokens are short-TTL one-time strings, so
 *     leaked screenshots stop working after 2 min.
 *
 * Why not LIFF-gate the issue side too?
 *   Tony's call 2026-05-15: keep staff-side onboarding zero-friction. We
 *   already had staff_whitelist drama; adding LINE-login-per-cashier is
 *   too heavy for a 5-restaurant pilot. PIN rotation handled out-of-band.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { requireLiffAuth } from "../middleware/liffAuth.js";
import { issueCheckoutTicket, redeemCheckoutTicket } from "../db.js";

const router = Router();

function requireStaffPin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.STAFF_NUMERIC_PASSWORD;
  if (!expected) {
    return res.status(503).json({ ok: false, reason: "pin_not_configured" });
  }
  const provided = req.header("x-staff-pin") || (req.body?.pin as string | undefined);
  if (provided !== expected) {
    return res.status(401).json({ ok: false, reason: "invalid_pin" });
  }
  next();
}

// Issue a new amount-bearing ticket. Staff-only via numeric PIN.
router.post("/issue", requireStaffPin, async (req: Request, res: Response) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, reason: "invalid_amount" });
    }
    const restaurantId = (req.body?.restaurant_id as string | undefined) ?? null;
    const issuedBy = (req.body?.issued_by as string | undefined) ?? "numeric_password";

    const result = await issueCheckoutTicket(amount, issuedBy, restaurantId);
    if ("error" in result) {
      return res.status(400).json({ ok: false, reason: result.error });
    }
    return res.json({
      ok: true,
      token: result.token,
      dice_to_issue: result.diceToIssue,
      amount: result.amount,
      expires_at: result.expiresAt,
    });
  } catch (err) {
    console.error("[checkout-ticket/issue] failed:", err);
    return res.status(500).json({ ok: false, reason: "server_error" });
  }
});

// Redeem a ticket — LIFF-auth gated. Anyone who scans first wins.
router.post("/redeem", requireLiffAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { lineUserId?: string }).lineUserId;
    if (!userId) return res.status(401).json({ ok: false, reason: "no_user" });
    const token = (req.body?.token as string | undefined)?.trim();
    if (!token) return res.status(400).json({ ok: false, reason: "token_required" });

    const result = await redeemCheckoutTicket(userId, token);
    if (result.ok) {
      return res.json({
        ok: true,
        dice_issued: result.diceIssued,
        amount: result.amount,
        restaurant_id: result.restaurantId,
      });
    }
    const status = result.reason === "already_used" ? 409 : result.reason === "expired" ? 410 : 404;
    return res.status(status).json({ ok: false, reason: result.reason });
  } catch (err) {
    console.error("[checkout-ticket/redeem] failed:", err);
    return res.status(500).json({ ok: false, reason: "server_error" });
  }
});

export default router;
