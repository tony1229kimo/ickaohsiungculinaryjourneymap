/**
 * LINE Messaging API — push helper.
 *
 * Used by /api/admin/tables/:tid/activate to send the "you have N rolls,
 * tap to play" message to the customer's LINE chat with our official account.
 *
 * Push (vs Reply) consumes monthly quota. Free LINE OA = 200/month, 認證 = 5000.
 * If we send 1 message per customer per visit and the game gets popular at IC
 * Kaohsiung's 5 restaurants, we'll burn through 200 in a single weekend —
 * Tony should plan on at least a "認證" tier or pay-as-you-go.
 *
 * Multi-hotel: env vars are suffixed with hotel ID (e.g. ..._KH, ..._TPE).
 * The caller passes which hotel — we look up the right token.
 */

interface FlexInvitePayload {
  customerUserId: string;
  diceCount: number;
  restaurantName: string;
  liffUrl: string;
}

interface RewardCouponPayload {
  customerUserId: string;
  rewardName: string;
  couponLink: string;
  compensationNote?: string;  // populated when admin manually granted as compensation
}

/**
 * Tony 2026-05-23: check whether the given LINE userId is a friend of our
 * OA. Used for the gating page so guests must add the OA before playing —
 * non-friends can't receive any coupon push, defeating the whole reward
 * mechanic.
 *
 * Implementation note: LINE Messaging API does NOT expose a direct
 * "is this specific user a friend" endpoint. The closest reliable proxy is
 * `GET /v2/bot/profile/{userId}`:
 *   - 200 → the user has interacted with this OA (i.e. has at some point
 *     added it as a friend). Treat as friend.
 *   - 404 → the OA has no record of this user. Treat as NOT a friend.
 *   - other → degraded, caller defaults to friend so we don't lock people out.
 *
 * Caveat: a user who added and then BLOCKED the OA still returns 200 here.
 * Their friendship is functionally broken but our gate would let them
 * through; subsequent reward push attempts will then fail and be logged.
 */
export async function checkFriendship(
  hotelId: string,
  userId: string,
): Promise<{ ok: true; isFriend: boolean } | { ok: false; reason: string }> {
  const tokenEnv = `LINE_MESSAGING_ACCESS_TOKEN_${hotelId.toUpperCase()}`;
  const token = process.env[tokenEnv];
  if (!token) {
    return { ok: false, reason: `${tokenEnv} not configured` };
  }
  try {
    const resp = await fetch(`https://api.line.me/v2/bot/profile/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.status === 200) return { ok: true, isFriend: true };
    if (resp.status === 404) return { ok: true, isFriend: false };
    const errBody = await resp.text().catch(() => "");
    return { ok: false, reason: `HTTP ${resp.status} ${errBody.slice(0, 200)}` };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Push a Flex Message containing a single reward coupon. Auto-fires when
 * the game detects a new entry in earned_rewards (P1 自動推送), or when the
 * admin compensates a customer via /admin grant-reward (P2 補發).
 */
export async function pushRewardCoupon(
  hotelId: string,
  payload: RewardCouponPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const tokenEnv = `LINE_MESSAGING_ACCESS_TOKEN_${hotelId.toUpperCase()}`;
  const token = process.env[tokenEnv];
  if (!token) {
    return { ok: false, reason: `${tokenEnv} not configured` };
  }
  const message = buildFlexReward(payload);
  try {
    const resp = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: payload.customerUserId, messages: [message] }),
    });
    if (resp.ok) return { ok: true };
    const errBody = await resp.text().catch(() => "");
    return { ok: false, reason: `HTTP ${resp.status} ${errBody.slice(0, 200)}` };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

function buildFlexReward({ rewardName, couponLink, compensationNote }: RewardCouponPayload) {
  return {
    type: "flex",
    altText: `🎁 您獲得「${rewardName}」`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#3D3935",
        paddingAll: "16px",
        contents: [
          { type: "text", text: compensationNote ? "🎁 補發優惠券" : "🎁 恭喜獲獎", color: "#BFB592", size: "lg", weight: "bold", align: "center" },
          { type: "text", text: "高雄洲際 · 味蕾旅遊地圖", color: "#FFFFFF", size: "xs", align: "center", margin: "sm" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          { type: "text", text: rewardName, size: "md", weight: "bold", color: "#3D3935", align: "center", wrap: true },
          { type: "text", text: "點下方按鈕領取電子優惠券", size: "xs", color: "#6E6A62", align: "center", wrap: true },
          ...(compensationNote ? [{ type: "text" as const, text: `備註:${compensationNote}`, size: "xxs" as const, color: "#999999", align: "center" as const, wrap: true, margin: "sm" as const }] : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#BFB592",
            action: { type: "uri", label: "🎫 領取優惠券", uri: couponLink },
          },
        ],
      },
    },
  };
}

/**
 * Send a Flex Message inviting the customer to play.
 *
 * Returns { ok: true } on 200, { ok: false, reason } on any other status
 * or network error. Never throws — callers can decide whether to surface
 * the failure to the staff UI.
 */
export async function pushGameInvite(
  hotelId: string,
  payload: FlexInvitePayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const tokenEnv = `LINE_MESSAGING_ACCESS_TOKEN_${hotelId.toUpperCase()}`;
  const token = process.env[tokenEnv];
  if (!token) {
    return { ok: false, reason: `${tokenEnv} not configured` };
  }

  const message = buildFlexInvite(payload);

  try {
    const resp = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: payload.customerUserId,
        messages: [message],
      }),
    });

    if (resp.ok) return { ok: true };
    const errBody = await resp.text().catch(() => "");
    return { ok: false, reason: `HTTP ${resp.status} ${errBody}` };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────
// Flex Message body — visual invite card with a "立即遊玩" button.
// LINE Flex spec: https://developers.line.biz/en/reference/messaging-api/#flex-message
// ─────────────────────────────────────────────────────────────────

function buildFlexInvite({ diceCount, restaurantName, liffUrl }: FlexInvitePayload) {
  return {
    type: "flex",
    altText: `您有 ${diceCount} 次擲骰機會!點此開始遊戲`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#3D3935",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "🎲 味蕾旅遊地圖",
            color: "#BFB592",
            size: "lg",
            weight: "bold",
            align: "center",
          },
          {
            type: "text",
            text: restaurantName,
            color: "#FFFFFF",
            size: "xs",
            align: "center",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "🎉 恭喜!",
            size: "xl",
            weight: "bold",
            color: "#3D3935",
            align: "center",
          },
          {
            type: "text",
            text: `您獲得 ${diceCount} 次擲骰機會`,
            size: "md",
            color: "#3D3935",
            align: "center",
          },
          {
            type: "text",
            text: "完成旅程可兌換 NT$3,880 招牌主餐",
            size: "xs",
            color: "#6E6A62",
            align: "center",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#BFB592",
            action: {
              type: "uri",
              label: "立即遊玩 · Play Now",
              uri: liffUrl,
            },
          },
        ],
      },
    },
  };
}
