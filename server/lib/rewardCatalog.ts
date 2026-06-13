/**
 * Tony 2026-05-23: single source of truth for all rewards that customers
 * can earn (lottery / fixed-tile) or that admins can grant as compensation.
 *
 * Keep in sync with src/components/game/{LotteryCard, StampCard}.tsx — these
 * IDs / names / OmniChat coupon links are what actually delivers the coupon
 * into the customer's LINE chat. Changing names here without updating the
 * frontend will create UI drift; changing links will break delivery.
 *
 * Tile 15 (招牌主餐 大獎) is intentionally EXCLUDED from `GRANTABLE_REWARDS`
 * because Tony does not want admins to be able to manually grant the grand
 * prize. It must be earned by completing the 15-tile board.
 */

export interface RewardDef {
  id: string;              // stable key, e.g. "fixed_2", "lottery_chance_3"
  source: "fixed_tile" | "lottery_chance" | "lottery_fate";
  tile?: number;           // 2 / 6 / 8 / 11 / 15 for fixed_tile
  name: string;            // 中文 display name
  shortName: string;       // 簡稱 for compact UI
  couponLink: string;      // OmniChat bind URL — opening this in LINE delivers the coupon
}

// ─────────────────────────────────────────────────────────────────
// Fixed tile rewards — automatically earned when player lands on the tile
// ─────────────────────────────────────────────────────────────────
export const FIXED_TILE_REWARDS: RewardDef[] = [
  {
    id: "fixed_2",
    source: "fixed_tile",
    tile: 2,
    name: "Delicatesse 烘焙坊「指定點心」免費兌換券",
    shortName: "烘焙坊點心",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba36038e2fbe3c064de78a?platform=line&channelId=1656533412",
  },
  {
    id: "fixed_6",
    source: "fixed_tile",
    tile: 6,
    name: "NT$500 餐飲優惠券",
    shortName: "$500 餐飲券",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba35bec3025130d0f4eddb?platform=line&channelId=1656533412",
  },
  {
    id: "fixed_8",
    source: "fixed_tile",
    tile: 8,
    name: "NT$800 餐飲優惠券",
    shortName: "$800 餐飲券",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba34b9c3025130d0f4e4f2?platform=line&channelId=1656533412",
  },
  {
    id: "fixed_11",
    source: "fixed_tile",
    tile: 11,
    name: "指定主餐「買一送一」優惠券",
    shortName: "買1送1",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba379adb1d024b62b8b784?platform=line&channelId=1656533412",
  },
  // The grand prize lives in the catalog so push notifications work, but it is
  // omitted from GRANTABLE_REWARDS below — only earned via board completion.
  {
    id: "fixed_15",
    source: "fixed_tile",
    tile: 15,
    name: "「招牌主餐」免費兌換券",
    shortName: "大獎",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba34788fdc65656117bb93?platform=line&channelId=1656533412",
  },
];

// ─────────────────────────────────────────────────────────────────
// Lottery rewards — earned by drawing 機會/命運 cards
// ─────────────────────────────────────────────────────────────────
export const LOTTERY_REWARDS: RewardDef[] = [
  {
    id: "chance_1",
    source: "lottery_chance",
    name: "NT$ 200 餐飲優惠券",
    shortName: "$200 餐飲券",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba33cd7fa27915d2d94316?platform=line&channelId=1656533412",
  },
  {
    id: "chance_2",
    source: "lottery_chance",
    name: "「招牌飲品」免費兌換券",
    shortName: "招牌飲品",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba3373e9a32d659304b5ac?platform=line&channelId=1656533412",
  },
  {
    id: "chance_3",
    source: "lottery_chance",
    name: "「招牌前菜」免費兌換券",
    shortName: "招牌前菜",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba30fde9a32d659304932b?platform=line&channelId=1656533412",
  },
  {
    id: "chance_5",
    source: "lottery_chance",
    name: "玫果沁釀覆盆莓煎茶氣泡飲 免費兌換券",
    shortName: "玫果煎茶氣泡飲",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba2f6eb38a592f937df5ef?platform=line&channelId=1656533412",
  },
  {
    id: "fate_1",
    source: "lottery_fate",
    name: "NT$ 100 餐飲優惠券",
    shortName: "$100 餐飲券",
    couponLink: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba342bc3025130d0f4e01a?platform=line&channelId=1656533412",
  },
];

export const ALL_REWARDS: RewardDef[] = [...FIXED_TILE_REWARDS, ...LOTTERY_REWARDS];

/**
 * GRANTABLE_REWARDS — what an admin is allowed to compensation-grant.
 * Excludes tile 15 (大獎). Use this for the /admin grant-reward endpoint.
 */
export const GRANTABLE_REWARDS: RewardDef[] = ALL_REWARDS.filter((r) => r.id !== "fixed_15");

export function findReward(id: string): RewardDef | null {
  return ALL_REWARDS.find((r) => r.id === id) ?? null;
}

/** Match a lottery result (saved into game_state.earned_rewards as { type, reward: { id, name } })
 *  back to a catalog entry by name. Returns null if not found (silent skip). */
export function findRewardByLotteryName(name: string): RewardDef | null {
  return LOTTERY_REWARDS.find((r) => r.name === name) ?? null;
}

/** Look up a fixed-tile reward by tile number (2 / 6 / 8 / 11 / 15). */
export function findRewardByTile(tile: number): RewardDef | null {
  return FIXED_TILE_REWARDS.find((r) => r.tile === tile) ?? null;
}

// ─────────────────────────────────────────────────────────────────
// Tony 2026-06-13: duplicate-link guard. A coupon-link scramble (several
// rewards pointing at the same OmniChat bind URL) shipped to production and
// delivered the wrong coupon to customers. This catches a repeat at module
// load — non-fatal so a bad paste is loud in the logs without taking the API
// down. Keep rewardCatalog.ts ↔ LotteryCard.tsx ↔ StampCard.tsx in sync.
// ─────────────────────────────────────────────────────────────────
(() => {
  const seen = new Map<string, string>();
  for (const r of ALL_REWARDS) {
    const prev = seen.get(r.couponLink);
    if (prev) {
      console.error(
        `[rewardCatalog] ⚠ DUPLICATE couponLink — "${r.id}" shares the same OmniChat link as "${prev}". One of them is almost certainly wrong.`,
      );
    }
    seen.set(r.couponLink, r.id);
  }
})();
