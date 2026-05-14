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
import { getDiceRemaining, takeOneDice } from "../db.js";

const router = Router();
const liffAuth = requireLiffAuth();

// ─────────────────────────────────────────────────────────────────
// GET /api/dice-pool/me
// Returns remaining dice for the LIFF-authenticated user.
// ─────────────────────────────────────────────────────────────────

router.get("/me", liffAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { lineUserId?: string }).lineUserId;
  if (!userId) return res.status(401).json({ error: "no user" });

  res.json({
    user_id: userId,
    dice_remaining: await getDiceRemaining(userId),
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/dice/roll
// Atomically: decrement one dice + return the random 1-3 face.
// ─────────────────────────────────────────────────────────────────

router.post("/roll", liffAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { lineUserId?: string }).lineUserId;
  if (!userId) return res.status(401).json({ error: "no user" });

  const consumed = await takeOneDice(userId);
  if (!consumed) {
    return res.status(409).json({ error: "no_dice_available", dice_remaining: 0 });
  }

  // Server-authoritative roll. Client can never tamper with this.
  const rolled = 1 + Math.floor(Math.random() * 3);

  res.json({
    rolled,
    dice_remaining: consumed.remaining,
  });
});

export default router;
