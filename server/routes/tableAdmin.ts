/**
 * Staff admin endpoints — used by the LIFF admin page the wait staff opens
 * after checkout. See TABLE_FLOW_SPEC.md §3.2 (staff flow), §6.3 (endpoints).
 *
 * All routes go through:
 *   1. requireLiffAuth (existing) — verifies the staff is a real LINE user
 *   2. requireStaffWhitelist (new, below) — verifies they're in staff_whitelist
 *
 * The "activate" call is the magic moment: it issues dice_pool entries AND
 * pushes a LINE message to the bound customer in one transaction.
 *
 * TODO:
 *   - persist tables/bindings/dice_pool to SQLite (currently TODO stubs)
 *   - implement multi-binding fan-out per Tony's choice on A/B/C
 *   - call LINE push API with proper Flex Message including LIFF deep link
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { requireLiffAuth } from "../middleware/liffAuth.js";
import { activateTable, isStaff, listRestaurants, listRestaurantTables } from "../db.js";
import { pushGameInvite } from "../lib/linePush.js";

const router = Router();
const liffAuth = requireLiffAuth();

// ─────────────────────────────────────────────────────────────────
// Staff whitelist guard — checks the LINE user from id_token is allowed
// to use admin endpoints. Returns 403 if not.
// ─────────────────────────────────────────────────────────────────

async function requireStaffWhitelist(req: Request, res: Response, next: NextFunction) {
  const userId = (req as Request & { lineUserId?: string }).lineUserId;
  if (!userId) {
    return res.status(401).json({ error: "Missing line user" });
  }
  if (isStaff(userId)) {
    return next();
  }
  // Dev fallback: bypass if no LIFF channel configured (we already log this).
  // In production the whitelist is enforced.
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.warn(`[tableAdmin] dev mode — bypassing staff check for ${userId}`);
    return next();
  }
  return res.status(403).json({ error: "Not authorized as staff" });
}

const staffAuth = [liffAuth, requireStaffWhitelist];

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/restaurants — list restaurants this staff can manage
// ─────────────────────────────────────────────────────────────────

router.get("/restaurants", ...staffAuth, async (_req, res) => {
  // TODO future: filter to the staff's own restaurant_id if non-NULL in
  // staff_whitelist. For now everyone sees all of IC Kaohsiung's 5 restaurants.
  res.json({ restaurants: listRestaurants("KH") });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/restaurants/:rid/tables — table grid status
// ─────────────────────────────────────────────────────────────────

router.get("/restaurants/:rid/tables", ...staffAuth, async (req, res) => {
  const rows = listRestaurantTables(req.params.rid);
  res.json({
    restaurant_id: req.params.rid,
    tables: rows.map((t) => ({
      id: t.id,
      label: t.display_label,
      state: t.state,
      binding: t.active_user_id
        ? { user_id: t.active_user_id, bound_at: t.bound_at }
        : null,
    })),
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/tables/:tid/activate
// Body: { amount: 2400 }
// This is the "magic button" — issues dice_pool + pushes LINE message.
// ─────────────────────────────────────────────────────────────────

interface ActivatePayload {
  amount?: number;
}

router.post("/tables/:tid/activate", ...staffAuth, async (req: Request, res: Response) => {
  const tableId = req.params.tid;
  const { amount } = req.body as ActivatePayload;

  if (typeof amount !== "number" || amount < 0) {
    return res.status(400).json({ error: "amount required and must be non-negative" });
  }

  const DICE_PER_2000 = 2000;
  const DICE_CAP = 5; // defensive cap; raise if Tony wants no ceiling
  const dice = Math.min(Math.floor(amount / DICE_PER_2000), DICE_CAP);

  if (dice <= 0) {
    return res.status(400).json({
      error: `Amount ${amount} below threshold (NT$${DICE_PER_2000})`,
    });
  }

  const staffId = (req as Request & { lineUserId?: string }).lineUserId ?? "dev";
  const result = activateTable(tableId, amount, dice, staffId);

  if (!result.ok) {
    const status = result.reason === "table_not_found" ? 404 : 409;
    return res.status(status).json({ ok: false, reason: result.reason });
  }

  // Compose the LIFF deep link the customer taps from their LINE message.
  const liffId = process.env.GAME_LIFF_ID ?? "";
  const liffUrl = liffId
    ? `https://liff.line.me/${liffId}`
    : process.env.GAME_BASE_URL ?? "";
  // Restaurant name for the push card.
  const restaurantName = (listRestaurants("KH").find((r) => tableId.startsWith(r.id))?.name_zh) ?? "高雄洲際";

  const pushResult = await pushGameInvite("KH", {
    customerUserId: result.userId!,
    diceCount: result.diceIssued!,
    restaurantName,
    liffUrl,
  });

  res.json({
    ok: true,
    table_id: tableId,
    dice_issued: result.diceIssued,
    customer_user_id: result.userId,
    push_ok: pushResult.ok,
    push_reason: pushResult.ok ? undefined : pushResult.reason,
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/tables/:tid/cancel — undo a mistaken activation
// ─────────────────────────────────────────────────────────────────

router.post("/tables/:tid/cancel", ...staffAuth, async (req, res) => {
  // TODO: revert tables.state to 'idle', mark recent dice_pool exhausted_at=now()
  //       (only allow within N minutes of activation to limit blast radius)
  const tableId = req.params.tid;
  console.log(`[tableAdmin] TODO: cancel table=${tableId}`);
  res.json({ ok: true });
});

export default router;
