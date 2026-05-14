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
  // TODO: SELECT * FROM staff_whitelist WHERE user_id = ?
  // For now, dev fallback: pass through with warning
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
  // TODO: query restaurants joined with staff_whitelist.restaurant_id
  // (NULL restaurant_id = super_admin sees all)
  res.json({
    restaurants: [
      { id: "A", code: "TBD-A", name_zh: "TBD 餐廳 A", name_en: "TBD Restaurant A" },
    ],
  });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/restaurants/:rid/tables — table grid status
// ─────────────────────────────────────────────────────────────────

router.get("/restaurants/:rid/tables", ...staffAuth, async (req, res) => {
  // TODO: SELECT t.*, latest_binding(user_id, bound_at) FROM tables t
  //       LEFT JOIN table_bindings ... WHERE t.restaurant_id = ?
  res.json({
    restaurant_id: req.params.rid,
    tables: [
      // shape preview — replace with real query
      { id: `${req.params.rid}05`, label: "05", state: "bound",
        binding: { user_id: "Uxxx", display_name: "李 X 芬", bound_at: "12:48" } },
    ],
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
  const DICE_CAP = 5; // TBD §10 — defensive cap until Tony confirms
  const dice = Math.min(Math.floor(amount / DICE_PER_2000), DICE_CAP);

  if (dice <= 0) {
    return res.status(400).json({
      error: `Amount ${amount} below threshold (NT$${DICE_PER_2000})`,
    });
  }

  // TODO:
  //   1. SELECT latest non-consumed bindings for tableId within 30 min window
  //   2. According to TBD §10 choice (A/B/C), pick recipient(s)
  //   3. BEGIN TRANSACTION
  //      a. INSERT INTO dice_pool for each recipient
  //      b. UPDATE table_bindings SET consumed_at = now() for those bindings
  //      c. UPDATE tables SET state='activated' WHERE id=?
  //      d. INSERT INTO staff_actions audit log
  //   4. COMMIT
  //   5. Call LINE push API with Flex Message containing LIFF deep link to game

  const staffId = (req as Request & { lineUserId?: string }).lineUserId ?? "dev";

  console.log(
    `[tableAdmin] TODO: activate table=${tableId} amount=${amount} dice=${dice} staff=${staffId}`
  );

  res.json({
    ok: true,
    table_id: tableId,
    dice_issued: dice,
    recipients: [], // will be filled when wired
    // TODO: also return push_status so the admin UI can show "✓ 已推送給 X 位客戶"
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
