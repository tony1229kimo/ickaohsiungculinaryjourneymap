/**
 * LIFF id_token verification middleware.
 *
 * Background:
 *   - Without this, every /api/game-state/:userId/* route trusts the URL param
 *     blindly — anyone with curl can read/write any user's progress.
 *   - LINE provides a free verify endpoint we hit per request. No channel secret
 *     needed (only LINE_CHANNEL_ID, which is the numeric prefix of VITE_LIFF_ID).
 *
 * Env required for production:
 *   - LINE_CHANNEL_ID  e.g. "2007392834"
 *
 * Dev fallback (NODE_ENV !== "production"):
 *   - Channel ID unset → middleware allows requests through with a console warning
 *     so local dev with the mock "dev_user" keeps working.
 */

import type { Request, Response, NextFunction } from "express";

const VERIFY_ENDPOINT = "https://api.line.me/oauth2/v2.1/verify";
const isProduction = process.env.NODE_ENV === "production";

interface LineVerifyResponse {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  name?: string;
  picture?: string;
  error?: string;
  error_description?: string;
}

export function requireLiffAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const channelId = process.env.LINE_CHANNEL_ID;

    // Dev fallback — no channel configured, skip verification but warn loudly.
    if (!channelId) {
      if (isProduction) {
        return res.status(503).json({
          error: "LIFF auth disabled (LINE_CHANNEL_ID not configured in production)",
        });
      }
      // Dev: accept an explicit X-Dev-UserId header so e2e tests can
      // simulate different users; fall back to "dev_user" otherwise.
      const devUserId = req.header("x-dev-userid") || req.params.userId || "dev_user";
      (req as Request & { lineUserId?: string }).lineUserId = devUserId;
      console.warn(`[liffAuth] LINE_CHANNEL_ID unset — dev bypass as user=${devUserId}`);
      return next();
    }

    const authHeader = req.header("authorization") || req.header("Authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!idToken) {
      return res.status(401).json({ error: "Missing Authorization: Bearer <id_token>" });
    }

    try {
      const body = new URLSearchParams({ id_token: idToken, client_id: channelId });
      const lineRes = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const data = (await lineRes.json()) as LineVerifyResponse;

      if (!lineRes.ok || !data.sub) {
        return res.status(401).json({
          error: "id_token verification failed",
          detail: data.error_description || data.error || `HTTP ${lineRes.status}`,
        });
      }

      // Bind the verified LINE userId to the URL param.
      // This is the whole point — without it, an attacker with a valid LIFF
      // login could still PUT to /api/game-state/SOMEONE_ELSE.
      const urlUserId = req.params.userId;
      if (urlUserId && urlUserId !== data.sub) {
        return res.status(403).json({
          error: "Token userId does not match URL userId",
        });
      }

      (req as Request & { lineUserId?: string }).lineUserId = data.sub;
      next();
    } catch (err) {
      console.error("[liffAuth] verify call failed:", err);
      return res.status(502).json({ error: "Failed to reach LINE verify endpoint" });
    }
  };
}
