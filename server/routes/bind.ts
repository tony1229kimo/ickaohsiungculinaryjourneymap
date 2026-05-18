/**
 * Restaurant-level binding endpoint (Tony 2026-05-18).
 *
 * Original flow:
 *   Customer scans table-side stand QR → adds LINE friend → types "table:ZL05"
 *   → backend webhook receives message → bindTableUser(ZL05, userId)
 *
 * New flow (per restaurant — no per-table tracking needed):
 *   Customer scans restaurant QR(LIFF URL with ?r=ZL) → LIFF auto-opens →
 *   frontend reads ?r=ZL → POST /api/bind/restaurant {code: "ZL"} →
 *   backend binds user to first table in that restaurant.
 *
 * Same anti-fraud locks apply because (user_id, table_id) is the dedup key,
 * not table_id alone — different customers all binding to ZL01 don't collide.
 */

import { Router, type Request, type Response } from "express";
import { requireLiffAuth } from "../middleware/liffAuth.js";
import { bindUserToRestaurant, recordEvent } from "../db.js";

const router = Router();

const VALID_RESTAURANTS = new Set(["ZL", "WR", "SD", "HW", "BL"]);

router.post("/restaurant", requireLiffAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { lineUserId?: string }).lineUserId;
    if (!userId) return res.status(401).json({ ok: false, reason: "no_user" });

    const code = (req.body?.code as string | undefined)?.toUpperCase().trim();
    if (!code) return res.status(400).json({ ok: false, reason: "code_required" });
    if (!VALID_RESTAURANTS.has(code)) {
      return res.status(400).json({ ok: false, reason: "invalid_restaurant_code" });
    }

    console.log(`[bind/restaurant] user=${userId} code=${code}`);
    const tableId = await bindUserToRestaurant(code, userId);
    if (!tableId) {
      return res.status(404).json({ ok: false, reason: "restaurant_not_found" });
    }

    await recordEvent({
      userId,
      eventType: "bind",
      restaurantId: code,
      payload: { table_id: tableId, source: "restaurant_qr" },
    });

    return res.json({ ok: true, restaurant: code, table_id: tableId });
  } catch (err) {
    console.error("[bind/restaurant] failed:", err);
    return res.status(500).json({ ok: false, reason: "server_error" });
  }
});

export default router;
