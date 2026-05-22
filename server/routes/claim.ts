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
    // Either token doesn't exist or already claimed.
    // Tony 2026-05-23: render inline HTML so we don't depend on cross-host
    // routing (the SPA lives on a different domain in Zeabur, and a stale
    // env var pointed wrappers at a decommissioned host → 404). Self-
    // contained page = zero infrastructure assumptions.
    res.set("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`<!doctype html>
<html lang="zh-TW">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>優惠券已領取過</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif; background: linear-gradient(180deg, #FEF3C7, #FED7AA); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .card { background: white; border: 2px solid #FCD34D; border-radius: 16px; padding: 24px; max-width: 380px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.08); text-align: center; }
  .icon { font-size: 48px; margin-bottom: 8px; }
  h1 { color: #1F2937; font-size: 20px; margin: 8px 0; }
  p { color: #4B5563; font-size: 14px; line-height: 1.6; margin: 8px 0 16px; }
  .tip { background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 10px 12px; text-align: left; font-size: 12px; color: #78350F; line-height: 1.5; }
  .tip b { color: #92400E; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">🎫</div>
    <h1>優惠券已領取過</h1>
    <p>這張優惠券您已經領取過了 — 請到 LINE 跟「<b>高雄洲際酒店</b>」官方帳號的聊天視窗,往上滑找到您先前領取的優惠券即可使用。</p>
    <div class="tip">💡 <b>找不到優惠券?</b> 在 LINE 聊天視窗點右上角搜尋 🔍 → 輸入「優惠券」即可找到所有已領取的券。</div>
  </div>
</body>
</html>`);
  }

  // First-claim path — redirect to OmniChat to actually deliver the coupon
  return res.redirect(302, r.rows[0].coupon_link);
});

export default router;
