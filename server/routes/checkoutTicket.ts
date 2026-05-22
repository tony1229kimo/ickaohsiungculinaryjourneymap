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
import { Pool } from "pg";
import { requireLiffAuth } from "../middleware/liffAuth.js";
import { issueCheckoutTicket, issueCompensationTicket, redeemCheckoutTicket } from "../db.js";
import { GRANTABLE_REWARDS } from "../lib/rewardCatalog.js";
import { pushRewardCoupon } from "../lib/linePush.js";

// Tony 2026-05-23: dedicated pool for the compensation endpoints — same shape
// as customers.ts's pool, kept local so the routes file is self-contained.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
});

const router = Router();

export function requireStaffPin(req: Request, res: Response, next: NextFunction) {
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
// Tony 2026-05-17: invoice_no required for normal checkout flow.
// Tony 2026-05-21: source='room_charge' skips invoice (hotel guests sign
// to room, no 統一發票 issued). See server/db.ts issueCheckoutTicket().
router.post("/issue", requireStaffPin, async (req: Request, res: Response) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, reason: "invalid_amount" });
    }
    const rawSource = (req.body?.source as string | undefined) ?? "checkout";
    if (rawSource !== "checkout" && rawSource !== "room_charge") {
      return res.status(400).json({ ok: false, reason: "invalid_source" });
    }
    const source: "checkout" | "room_charge" = rawSource;

    const invoiceNo = (req.body?.invoice_no as string | undefined)?.trim() || null;
    if (source === "checkout" && !invoiceNo) {
      return res.status(400).json({ ok: false, reason: "invoice_required" });
    }
    const restaurantId = (req.body?.restaurant_id as string | undefined) ?? null;
    const issuedBy = (req.body?.issued_by as string | undefined) ?? "numeric_password";

    const result = await issueCheckoutTicket(amount, issuedBy, restaurantId, invoiceNo, source);
    if ("error" in result) {
      const status = result.error === "invoice_already_used" ? 409 :
                     result.error === "invoice_already_pending" ? 409 :
                     400;
      return res.status(status).json({ ok: false, reason: result.error, existing: result.existing });
    }
    return res.json({
      ok: true,
      token: result.token,
      dice_to_issue: result.diceToIssue,
      amount: result.amount,
      expires_at: result.expiresAt,
      source,
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
        // Tony 2026-05-23: compensation tickets carry these
        compensation: result.compensation ?? false,
        reward_name: result.rewardName,
      });
    }
    const status =
      result.reason === "already_used" ? 409 :
      result.reason === "expired" ? 410 :
      result.reason === "server_error" ? 500 :
      404;
    // Tony 2026-05-22: forward `detail` so the customer's screen tells us
    // what actually broke instead of the generic "QR Code 無效" mask.
    return res.status(status).json({ ok: false, reason: result.reason, detail: result.detail });
  } catch (err) {
    console.error("[checkout-ticket/redeem] failed:", err);
    return res.status(500).json({ ok: false, reason: "server_error" });
  }
});

// ─────────────────────────────────────────────────────────────────
// Tony 2026-05-23: 補發優惠券 — same /admin/checkout page, just a third
// mode beside 一般結帳 / 掛房帳. Uses staff PIN auth (NOT LIFF whitelist)
// so 可愛員工 don't have to log into LINE on every shift.
// ─────────────────────────────────────────────────────────────────

// POST /api/checkout-ticket/issue-compensation
// Body: { pin, reward_id, note? }
// Tony 2026-05-23: 服務人員選一個補發獎品 → 後端發 QR ticket → 客人掃 → 拿券。
// Same UX as 結帳 QR / 掛房帳 QR, just no amount field.
router.post("/issue-compensation", requireStaffPin, async (req: Request, res: Response) => {
  const rewardId = String(req.body?.reward_id ?? "").trim();
  const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 200) : null;
  if (!rewardId) {
    return res.status(400).json({ ok: false, reason: "reward_id_required" });
  }
  const issuedBy = (req.body?.issued_by as string | undefined) ?? "staff_pin";
  const result = await issueCompensationTicket(rewardId, issuedBy, note);
  if ("error" in result) {
    return res.status(400).json({ ok: false, reason: result.error });
  }
  return res.json({
    ok: true,
    token: result.token,
    expires_at: result.expiresAt,
    reward_id: rewardId,
  });
});

// GET /api/checkout-ticket/rewards — catalog of grantable rewards.
router.get("/rewards", requireStaffPin, async (_req, res) => {
  res.json({
    rewards: GRANTABLE_REWARDS.map((r) => ({
      id: r.id,
      source: r.source,
      tile: r.tile,
      name: r.name,
      shortName: r.shortName,
    })),
  });
});

// POST /api/checkout-ticket/recent-customers — list recently-active customers
// for the staff to pick from when compensating. Limited to 50 most recent.
// Optional ?q=<text> filter on display_name (ILIKE).
router.post("/recent-customers", requireStaffPin, async (req: Request, res: Response) => {
  const search = typeof req.body?.q === "string" ? req.body.q.trim() : "";
  const params: unknown[] = [];
  let whereClause = "";
  if (search) {
    params.push(`%${search}%`);
    whereClause = `WHERE display_name ILIKE $1`;
  }
  const q = await pool.query(
    `SELECT user_id, display_name, last_seen_at, total_visits, total_spend
     FROM customer_profiles
     ${whereClause}
     ORDER BY last_seen_at DESC
     LIMIT 50`,
    params,
  );
  res.json({ customers: q.rows });
});

// POST /api/checkout-ticket/grant-reward — compensation grant from the
// staff-facing checkout page. Mirrors /api/admin/customers/:id/grant-reward
// but uses PIN auth instead of LIFF+whitelist.
// Body: { pin, user_id, reward_id, note? }
router.post("/grant-reward", requireStaffPin, async (req: Request, res: Response) => {
  const customerUserId = String(req.body?.user_id ?? "").trim();
  const rewardId = String(req.body?.reward_id ?? "").trim();
  const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 200) : null;

  if (!customerUserId || !/^U[0-9a-f]{32}$/i.test(customerUserId)) {
    return res.status(400).json({ ok: false, reason: "invalid_user_id" });
  }
  const reward = GRANTABLE_REWARDS.find((r) => r.id === rewardId);
  if (!reward) {
    return res.status(400).json({ ok: false, reason: "invalid_reward_id" });
  }

  const prof = await pool.query(`SELECT user_id, display_name FROM customer_profiles WHERE user_id = $1`, [customerUserId]);
  if (prof.rowCount === 0) {
    return res.status(404).json({ ok: false, reason: "customer_not_found" });
  }

  // 1) Push to LINE (best-effort — record the grant even if push fails)
  const push = await pushRewardCoupon("KH", {
    customerUserId,
    rewardId: reward.id,
    rewardName: reward.name,
    couponLink: reward.couponLink,
    compensationNote: note ?? undefined,
    source: "compensation",
  });

  // 2) Append to game_state.earned_rewards (board untouched)
  const earnedRewardEntry = {
    type: "compensation",
    reward: { id: reward.id, name: reward.name, icon: "🎁" },
    source: reward.source,
    grantedBy: "staff_pin",
    grantedAt: new Date().toISOString(),
    note,
  };
  await pool.query(
    `UPDATE game_state
     SET earned_rewards = COALESCE(earned_rewards, '[]'::jsonb) || $1::jsonb,
         updated_at = NOW()
     WHERE user_id = $2`,
    [JSON.stringify([earnedRewardEntry]), customerUserId],
  );

  // 3) Audit log
  await pool.query(
    `INSERT INTO customer_events (user_id, event_type, payload)
     VALUES ($1, 'reward_compensation', $2::jsonb)`,
    [customerUserId, JSON.stringify({ reward_id: reward.id, reward_name: reward.name, granted_by: "staff_pin", note, push_ok: push.ok, push_reason: push.ok ? null : push.reason })],
  );

  // 4) Counter
  await pool.query(
    `UPDATE customer_profiles SET total_rewards_earned = total_rewards_earned + 1 WHERE user_id = $1`,
    [customerUserId],
  );

  return res.json({
    ok: true,
    customer_name: prof.rows[0].display_name ?? null,
    reward: { id: reward.id, name: reward.name },
    push_ok: push.ok,
    push_reason: push.ok ? null : push.reason,
  });
});

export default router;
