/**
 * LINE Messaging API webhook handler.
 *
 * Inbound events we care about:
 *   - "follow":     user added the official account → send welcome
 *   - "message":    text body parsed for "table:<XX>" → bind user to table
 *   - "unfollow":   user blocked us → invalidate their bindings
 *
 * Spec: TABLE_FLOW_SPEC.md §3.1 (customer flow), §6.1 (webhook), §5.4 (bindings).
 *
 * Required env:
 *   LINE_MESSAGING_CHANNEL_SECRET_KH   - for signature verification
 *   LINE_MESSAGING_ACCESS_TOKEN_KH     - for reply API
 *
 * TODO before this can run for real:
 *   - persist bindings to SQLite (currently in-memory placeholder)
 *   - wire to /api/admin/tables/:tid/activate so push messaging works
 *   - implement signature verification (LINE Channel Secret HMAC-SHA256)
 *   - multi-hotel routing once IC Taipei comes online (route by channel ID)
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { bindTableUser, tableExists, upsertProfile, recordEvent } from "../db.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────
// Signature verification — LINE signs requests with the Channel Secret.
// Without verification anyone could POST fake events.
// ─────────────────────────────────────────────────────────────────

function verifyLineSignature(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  // timingSafeEqual to avoid leaking comparison time
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Parse "table:A05" from message text. Accepts a few common variants
// because LINE bot messages often get auto-formatted (space/zh-tw colons).
// ─────────────────────────────────────────────────────────────────

// Table IDs are <restaurant_code><number>, e.g. ZL05, WR12, BL30.
// Restaurant code is 1-3 letters; table number is 1-3 digits.
const TABLE_BIND_RE = /^\s*table\s*[:：]\s*([A-Z]{1,3}\d{1,3})\s*$/i;

function parseTableId(text: string | undefined): string | null {
  if (!text) return null;
  const m = text.match(TABLE_BIND_RE);
  return m ? m[1].toUpperCase() : null;
}

// ─────────────────────────────────────────────────────────────────
// LINE reply API — quick reply to a webhook event.
// (Push API is used elsewhere when staff hits "activate".)
// ─────────────────────────────────────────────────────────────────

async function replyToLine(replyToken: string, text: string): Promise<void> {
  const token = process.env.LINE_MESSAGING_ACCESS_TOKEN_KH;
  if (!token) {
    console.warn("[webhook] LINE_MESSAGING_ACCESS_TOKEN_KH not set, skipping reply");
    return;
  }
  try {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text }],
      }),
    });
  } catch (err) {
    console.error("[webhook] reply failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────
// Event handlers
// ─────────────────────────────────────────────────────────────────

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { userId?: string; type?: string };
  message?: { type?: string; text?: string };
}

async function handleFollow(event: LineEvent) {
  if (!event.replyToken) return;

  // Record the new follower in profile + events for marketing analytics
  const userId = event.source?.userId;
  if (userId) {
    await upsertProfile(userId);
    await recordEvent({
      userId,
      eventType: "bind",
      payload: { source: "follow" },
    });
  }

  await replyToLine(
    event.replyToken,
    "歡迎加入高雄洲際酒店！\n\n用餐時請對著桌邊立牌再掃一次 QR,\n結帳後即可開始味蕾旅程遊戲 🎲\n\nWelcome to InterContinental Kaohsiung!"
  );
}

async function handleMessage(event: LineEvent) {
  if (event.message?.type !== "text") return;
  const userId = event.source?.userId;
  if (!userId) return;

  const tableId = parseTableId(event.message.text);
  if (!tableId) {
    // Not a binding command — could be customer support / FAQ in the future.
    return;
  }

  if (!(await tableExists(tableId))) {
    if (event.replyToken) {
      await replyToLine(
        event.replyToken,
        `找不到「${tableId}」這張桌號,請確認桌邊立牌的 QR Code 是否正確。\n\nTable ${tableId} not found.`,
      );
    }
    return;
  }

  const ok = await bindTableUser(tableId, userId);
  if (!ok) {
    if (event.replyToken) {
      await replyToLine(event.replyToken, "綁定失敗,請聯絡現場人員。Binding failed — please contact staff.");
    }
    return;
  }

  // Marketing audit — track every table binding by restaurant prefix
  const restaurantId = tableId.replace(/\d+$/, "");
  await recordEvent({
    userId,
    eventType: "bind",
    restaurantId,
    payload: { table_id: tableId, source: "table_qr" },
  });

  if (event.replyToken) {
    await replyToLine(
      event.replyToken,
      `✅ 已綁定 ${tableId} 桌\n結帳後將收到遊戲通知 🎲\n\nTable ${tableId} bound — game invite arrives after checkout.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Webhook route. Note: Express's standard json() parser eats the body
// before we can verify the raw signature. We use express.raw() instead.
// (Mount-time middleware wiring in server/index.ts — see below.)
// ─────────────────────────────────────────────────────────────────

router.post("/line", async (req: Request, res: Response) => {
  const secret = process.env.LINE_MESSAGING_CHANNEL_SECRET_KH;
  if (!secret) {
    console.warn("[webhook] LINE_MESSAGING_CHANNEL_SECRET_KH not set — accepting unsigned events (DEV ONLY)");
  }

  const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body);
  const signature = req.header("x-line-signature");

  if (secret && !verifyLineSignature(rawBody, signature, secret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const events: LineEvent[] = req.body?.events ?? [];

  // Respond 200 immediately — LINE expects fast ack. Process events async.
  res.status(200).json({ ok: true });

  for (const event of events) {
    try {
      if (event.type === "follow") await handleFollow(event);
      else if (event.type === "message") await handleMessage(event);
      // TODO: handle "unfollow" → invalidate bindings for this userId
    } catch (err) {
      console.error("[webhook] event handler failed:", event.type, err);
    }
  }
});

export default router;
