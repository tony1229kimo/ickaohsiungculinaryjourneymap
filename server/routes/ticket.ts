/**
 * Ticket redeem endpoint.
 *
 * Flow:
 *   1. Customer scans dynamic QR at qrcode-generator → /scan/<token>
 *   2. qrcode-generator redirects them to https://<game>/?ticket=<token>
 *   3. Game frontend POSTs here with { ticket }
 *   4. We forward to qrcode-generator's POST /api/verify/<token> using
 *      VERIFY_SECRET. That call atomically consumes the ticket.
 *   5. We return { ok: true } to the frontend, which then sets isQRVerified.
 *
 * Without this server-side hop the frontend would have to call the verify
 * endpoint directly, which means VERIFY_SECRET would need to ship in the
 * client bundle — defeating the secret entirely.
 *
 * Env required:
 *   - QR_GENERATOR_URL   e.g. "https://qrcode-generator.zeabur.app"
 *   - VERIFY_SECRET      shared with qrcode-generator
 */

import { Router, type Request, type Response } from "express";
import { requireLiffAuth } from "../middleware/liffAuth.js";

const router = Router();
const liffAuth = requireLiffAuth();

router.post("/redeem", liffAuth, async (req: Request, res: Response) => {
  const ticket = (req.body?.ticket as string | undefined)?.trim();
  if (!ticket) {
    return res.status(400).json({ ok: false, error: "ticket required" });
  }

  const generatorUrl = process.env.QR_GENERATOR_URL;
  const verifySecret = process.env.VERIFY_SECRET;
  if (!generatorUrl || !verifySecret) {
    return res.status(503).json({
      ok: false,
      error: "Ticket verification disabled (QR_GENERATOR_URL or VERIFY_SECRET unset)",
    });
  }

  try {
    const upstream = await fetch(`${generatorUrl}/api/verify/${encodeURIComponent(ticket)}`, {
      method: "POST",
      headers: { "X-Verify-Secret": verifySecret },
    });
    const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;

    if (upstream.ok && data.valid === true) {
      return res.json({ ok: true });
    }
    return res.status(upstream.status === 409 ? 409 : 401).json({
      ok: false,
      reason: (data.reason as string) || "rejected",
    });
  } catch (err) {
    console.error("[ticket/redeem] upstream call failed:", err);
    return res.status(502).json({ ok: false, error: "Failed to reach QR generator" });
  }
});

export default router;
