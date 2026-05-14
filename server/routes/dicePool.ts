/**
 * Dice pool — the "how many rolls do I have left" counter that replaces
 * the old "scan a QR each time" model.
 *
 * Flow:
 *   - Staff activates a table → dice_pool row created for the bound user
 *   - Customer opens LIFF game → GET /api/dice-pool/me to read remaining
 *   - Customer hits the dice button → POST /api/dice/roll
 *       - server picks random 1-3
 *       - server decrements dice_remaining
 *       - server returns the roll value and updated remaining
 *
 * Rolling is server-authoritative on purpose: the old design let the client
 * pick a number and tell the server, which means a tampered client could
 * always roll 3. Now the server rolls and the client just animates.
 *
 * Spec: TABLE_FLOW_SPEC.md §6.2 (customer-facing API), §5.5 (schema).
 */

import { Router, type Request, type Response } from "express";
import { requireLiffAuth } from "../middleware/liffAuth.js";

const router = Router();
const liffAuth = requireLiffAuth();

// ─────────────────────────────────────────────────────────────────
// GET /api/dice-pool/me
// Returns remaining dice for the LIFF-authenticated user.
// ─────────────────────────────────────────────────────────────────

router.get("/me", liffAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { lineUserId?: string }).lineUserId;
  if (!userId) return res.status(401).json({ error: "no user" });

  // TODO: SELECT SUM(dice_remaining) FROM dice_pool
  //       WHERE user_id=? AND exhausted_at IS NULL
  res.json({
    user_id: userId,
    dice_remaining: 0, // TODO: replace with real query
    pools: [],         // TODO: per-restaurant breakdown { restaurant_id, remaining }
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/dice/roll
// Atomically: decrement one dice + return the random 1-3 face.
// ─────────────────────────────────────────────────────────────────

router.post("/roll", liffAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { lineUserId?: string }).lineUserId;
  if (!userId) return res.status(401).json({ error: "no user" });

  // TODO:
  //   BEGIN TRANSACTION
  //     SELECT id, dice_remaining FROM dice_pool
  //       WHERE user_id=? AND exhausted_at IS NULL AND dice_remaining > 0
  //       ORDER BY issued_at ASC LIMIT 1   -- oldest pool first (FIFO)
  //     If none → return 409 { error: "no dice available" }
  //     UPDATE dice_pool SET dice_remaining = dice_remaining - 1
  //       WHERE id = ?
  //     If new dice_remaining = 0 → UPDATE exhausted_at = now()
  //   COMMIT
  //
  // Then roll the actual dice value server-side:
  //   const value = 1 + Math.floor(Math.random() * 3);

  const value = 1 + Math.floor(Math.random() * 3);

  console.log(`[dicePool] TODO: persist roll for user=${userId} value=${value}`);

  res.json({
    rolled: value,           // 1-3
    dice_remaining: 0,       // TODO: actual remaining after decrement
  });
});

export default router;
