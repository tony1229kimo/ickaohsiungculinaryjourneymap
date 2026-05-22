/**
 * /api/me/* — endpoints scoped to the currently authenticated LIFF user.
 * Tony 2026-05-23: introduced for the friendship gate (P0).
 */

import { Router, type Request } from "express";
import { requireLiffAuth } from "../middleware/liffAuth.js";
import { checkFriendship } from "../lib/linePush.js";

const router = Router();
const liffAuth = requireLiffAuth();

// ─────────────────────────────────────────────────────────────────
// GET /api/me/friendship
//
// Returns whether the current LIFF user has added the IC Kaohsiung LINE
// official account as a friend. The frontend uses this to gate game entry —
// non-friends see a "please add friend first" page, because we can't push
// any reward coupon to them otherwise.
// ─────────────────────────────────────────────────────────────────
router.get("/friendship", liffAuth, async (req, res) => {
  const userId = (req as Request & { lineUserId?: string }).lineUserId;
  if (!userId) {
    return res.status(401).json({ ok: false, reason: "missing_user" });
  }
  const result = await checkFriendship("KH", userId);
  if (!result.ok) {
    // If LINE friendship API itself failed (token misconfig, transient),
    // default to "isFriend: true" so we don't lock out customers due to our
    // infrastructure problems. Surface the reason in detail for ops visibility.
    console.warn("[me/friendship] check failed, defaulting to friend:", result.reason);
    return res.json({ ok: true, isFriend: true, degraded: true, detail: result.reason });
  }
  return res.json({ ok: true, isFriend: result.isFriend });
});

export default router;
