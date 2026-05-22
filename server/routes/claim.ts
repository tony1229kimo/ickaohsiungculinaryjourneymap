/**
 * Coupon claim wrapper — single-use token redirect.
 *
 * Tony 2026-05-23: OmniChat's coupon URLs are stateless (each click delivers
 * a fresh coupon). We can't change OmniChat. Instead we wrap each LINE push
 * with a token-protected URL. The button in the Flex bubble points here.
 *
 * Flow:
 *   Customer taps "領取優惠券" in LINE chat
 *   → GET /api/claim/:token (this route)
 *   → atomic UPDATE SET claimed_at = NOW() WHERE token = $1 AND claimed_at IS NULL
 *      ↳ if rowcount == 1 (first click) → 302 redirect to the real OmniChat URL
 *      ↳ if rowcount == 0 (already used) → 302 redirect to /coupon-used HTML
 */

import { Router, type Request, type Response } from "express";
import { Pool } from "pg";

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
});

router.get("/:token", async (req: Request, res: Response) => {
  const token = req.params.token;
  if (!token) {
    return res.status(400).send("missing token");
  }

  // Atomic claim: only the first hit gets the coupon link back. Concurrent
  // duplicate clicks (multi-tap, double-fired Flex button) all race for the
  // same UPDATE; Postgres serializes them and only one wins.
  const r = await pool.query<{ coupon_link: string; reward_name: string }>(
    `UPDATE claim_tokens
     SET claimed_at = NOW()
     WHERE token = $1 AND claimed_at IS NULL
     RETURNING coupon_link, reward_name`,
    [token],
  );

  if ((r.rowCount ?? 0) === 0) {
    // Either token doesn't exist or has been claimed. Redirect to a friendly
    // "already used" page rendered by the SPA. We use the request host so
    // local dev and prod both work without env-var plumbing.
    const host = req.get("host") ?? "ickhh-culinary-game-v2.zeabur.app";
    const proto = (req.get("x-forwarded-proto") ?? "https").split(",")[0];
    return res.redirect(302, `${proto}://${host}/coupon-used`);
  }

  // First-claim path — redirect to OmniChat to actually deliver the coupon
  return res.redirect(302, r.rows[0].coupon_link);
});

export default router;
