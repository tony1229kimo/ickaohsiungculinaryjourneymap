/**
 * Customer admin endpoints (Phase 7).
 *
 * For 行銷部 — view profile aggregates, drill into individual customer
 * timelines, export CSV.
 *
 * Gated by LIFF auth + staff_whitelist (same as tableAdmin).
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { Pool } from "pg";
import { requireLiffAuth } from "../middleware/liffAuth.js";
import { isStaff } from "../db.js";

const router = Router();
const liffAuth = requireLiffAuth();

// Reuse a separate Pool so we don't tangle with db.ts's connections.
// Cheap — pg pools are lazy + connections shared via OS-level mux.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
});

async function requireStaffWhitelist(req: Request, res: Response, next: NextFunction) {
  const userId = (req as Request & { lineUserId?: string }).lineUserId;
  if (!userId) return res.status(401).json({ error: "Missing line user" });
  if (await isStaff(userId)) return next();
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[customers] dev bypass for ${userId}`);
    return next();
  }
  return res.status(403).json({ error: "Not authorized as staff" });
}

// Tony 2026-05-21: View-only URL token bypass.
//
// `?key=<ADMIN_VIEW_KEY>` lets Tony share a single secret URL with
// trusted external viewers (行銷部主管 etc.) without managing LINE userIds
// in staff_whitelist. PII risk is on the URL holder — see CLAUDE.md.
//
// Precedence: if `?key=` matches env var → bypass LIFF + whitelist entirely.
// Otherwise fall through to the normal (LIFF + whitelist) chain.
const VIEW_KEY = process.env.ADMIN_VIEW_KEY;

function gateRead(req: Request, res: Response, next: NextFunction) {
  if (VIEW_KEY && typeof req.query.key === "string" && req.query.key === VIEW_KEY) {
    (req as Request & { isViewToken?: boolean }).isViewToken = true;
    return next();
  }
  // Fall through: liffAuth → requireStaffWhitelist → original next
  liffAuth(req, res, () => {
    void requireStaffWhitelist(req, res, next);
  });
}

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/customers/_debug/whoami
//
// Tony 2026-05-21: Debug endpoint — LIFF-gated ONLY (does NOT require
// staff_whitelist). Returns the userId the backend extracted from the
// id_token + whether that userId is in staff_whitelist + the actual
// whitelist row if any. Use this to diagnose "我明明在白名單但被擋" cases:
//   1. Hit /api/admin/customers/_debug/whoami from the rejecting Chrome
//   2. Compare `verified_user_id` with what AdminCustomersPage shows
//   3. Check `in_whitelist` + `whitelist_row` to confirm DB state
//
// Each char's hex code-point is included so we can spot zero-width or
// look-alike characters that would silently break the equality check.
// ─────────────────────────────────────────────────────────────────
router.get("/_debug/whoami", liffAuth, async (req, res) => {
  const r = req as Request & {
    lineUserId?: string;
    lineDisplayName?: string;
    linePictureUrl?: string;
  };
  const userId = r.lineUserId;
  if (!userId) {
    return res.status(401).json({ error: "Missing line user (liffAuth did not set lineUserId)" });
  }

  const wlQ = await pool.query(
    `SELECT user_id, name, role, restaurant_id, added_at
     FROM staff_whitelist WHERE user_id = $1`,
    [userId],
  );
  const allStaffQ = await pool.query<{ user_id: string; name: string }>(
    `SELECT user_id, name FROM staff_whitelist ORDER BY added_at DESC LIMIT 20`,
  );

  res.json({
    verified_user_id: userId,
    verified_user_id_len: userId.length,
    verified_user_id_codepoints: Array.from(userId).map((ch) => ({
      ch,
      hex: "U+" + ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0"),
    })),
    verified_display_name: r.lineDisplayName ?? null,
    verified_picture_url: r.linePictureUrl ?? null,
    in_whitelist: (wlQ.rowCount ?? 0) > 0,
    whitelist_row: wlQ.rows[0] ?? null,
    all_staff: allStaffQ.rows,
    node_env: process.env.NODE_ENV ?? "(unset)",
    db_host_hint: (process.env.DATABASE_URL ?? "").replace(/\/\/[^@]+@/, "//***@").slice(0, 80),
  });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/customers
//   query: ?sort=last_seen|total_spend|total_visits|total_rewards (default last_seen)
//          &order=desc|asc (default desc)
//          &limit=50 (max 200)
//          &offset=0
//          &since=2026-01-01 (filter first_seen_at >=)
//          &search=foo (matches display_name)
// ─────────────────────────────────────────────────────────────────

const ALLOWED_SORTS = new Set([
  "last_seen_at", "first_seen_at",
  "total_spend", "total_visits", "total_dice_rolled",
  "total_rewards_earned", "total_seasons",
]);

router.get("/", gateRead, async (req, res) => {
  const sortCol = ALLOWED_SORTS.has(String(req.query.sort)) ? String(req.query.sort) : "last_seen_at";
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  const limit = Math.min(200, parseInt(String(req.query.limit), 10) || 50);
  const offset = Math.max(0, parseInt(String(req.query.offset), 10) || 0);
  const since = typeof req.query.since === "string" ? req.query.since : null;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : null;

  // Tony 2026-05-21: ?restaurant=XX drill-down — filter to customers who have
  // at least one event at that restaurant. Whitelist against the known 5
  // outlet codes so the parameter can't be used to inject SQL or to probe
  // for arbitrary table names.
  const VALID_RESTAURANTS = new Set(["ZL", "WR", "SD", "HW", "BL"]);
  const restaurant = typeof req.query.restaurant === "string"
    ? req.query.restaurant.toUpperCase().trim()
    : null;
  const restaurantFilter = restaurant && VALID_RESTAURANTS.has(restaurant) ? restaurant : null;

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (since) {
    params.push(since);
    conditions.push(`first_seen_at >= $${params.length}::timestamptz`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`display_name ILIKE $${params.length}`);
  }
  if (restaurantFilter) {
    params.push(restaurantFilter);
    conditions.push(`user_id IN (
       SELECT DISTINCT user_id FROM customer_events
       WHERE restaurant_id = $${params.length}
     )`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // Total count
  const countQ = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM customer_profiles ${whereClause}`,
    params,
  );
  const total = parseInt(countQ.rows[0].count, 10);

  params.push(limit);
  params.push(offset);
  const rowsQ = await pool.query(
    `SELECT user_id, display_name, picture_url,
            first_seen_at, last_seen_at,
            total_visits, total_spend, total_dice_rolled,
            total_rewards_earned, total_seasons
     FROM customer_profiles
     ${whereClause}
     ORDER BY ${sortCol} ${order} NULLS LAST
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  res.json({
    total,
    limit,
    offset,
    customers: rowsQ.rows,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/customers/:userId — profile + recent events timeline
// ─────────────────────────────────────────────────────────────────

router.get("/:userId", gateRead, async (req, res) => {
  const userId = req.params.userId;

  const prof = await pool.query(
    `SELECT * FROM customer_profiles WHERE user_id = $1`,
    [userId],
  );
  if (prof.rowCount === 0) return res.status(404).json({ error: "not_found" });

  const events = await pool.query(
    `SELECT id, event_type, restaurant_id, amount, payload, created_at
     FROM customer_events
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId],
  );

  // Also pull current game_state (棋盤位置 + 已領獎)
  const game = await pool.query(
    `SELECT total_points, claimed_tiles, earned_rewards, updated_at
     FROM game_state WHERE user_id = $1`,
    [userId],
  );

  res.json({
    profile: prof.rows[0],
    events: events.rows,
    game_state: game.rows[0] ?? null,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/customers/export.csv
// CSV download. Same filters as list.
// ─────────────────────────────────────────────────────────────────

router.get("/export.csv", gateRead, async (req, res) => {
  const since = typeof req.query.since === "string" ? req.query.since : null;
  const params: unknown[] = [];
  let whereClause = "";
  if (since) {
    params.push(since);
    whereClause = `WHERE first_seen_at >= $1::timestamptz`;
  }
  const rowsQ = await pool.query(
    `SELECT user_id, display_name,
            to_char(first_seen_at AT TIME ZONE 'Asia/Taipei', 'YYYY-MM-DD HH24:MI') AS first_seen,
            to_char(last_seen_at AT TIME ZONE 'Asia/Taipei', 'YYYY-MM-DD HH24:MI') AS last_seen,
            total_visits, total_spend, total_dice_rolled,
            total_rewards_earned, total_seasons
     FROM customer_profiles
     ${whereClause}
     ORDER BY total_spend DESC NULLS LAST`,
    params,
  );

  // RFC 4180 CSV with BOM so Excel reads UTF-8 correctly
  const headers = [
    "LINE user_id", "顯示名稱", "首次互動", "最近活動",
    "來訪次數", "累計消費", "擲骰總次", "領獎總次", "完成季數",
  ];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rowsQ.rows) {
    lines.push([
      row.user_id, row.display_name ?? "",
      row.first_seen, row.last_seen,
      row.total_visits, row.total_spend, row.total_dice_rolled,
      row.total_rewards_earned, row.total_seasons,
    ].map(escape).join(","));
  }
  const csv = "﻿" + lines.join("\r\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="ic-kaohsiung-customers-${new Date().toISOString().slice(0, 10)}.csv"`,
  );
  res.send(csv);
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/customers/_stats/overview
// Top-line numbers for dashboard summary card
// ─────────────────────────────────────────────────────────────────

router.get("/_stats/overview", gateRead, async (_req, res) => {
  const summary = await pool.query(`
    SELECT
      COUNT(*)::int AS total_customers,
      COUNT(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '7 days')::int AS active_7d,
      COUNT(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '30 days')::int AS active_30d,
      COUNT(*) FILTER (WHERE total_visits > 0)::int AS has_visited,
      COUNT(*) FILTER (WHERE total_rewards_earned > 0)::int AS has_rewarded,
      COALESCE(SUM(total_spend), 0)::int AS total_spend,
      COALESCE(SUM(total_dice_rolled), 0)::int AS total_rolls,
      COALESCE(SUM(total_rewards_earned), 0)::int AS total_rewards
    FROM customer_profiles
  `);

  // Tony 2026-05-21: 4-stage funnel for the dashboard top-card.
  // Stage 2 (bound_to_restaurant) is users who scanned a restaurant QR — they
  // count distinctly across outlets, so summing by_restaurant.unique_visitors
  // would over-count if a single user visited multiple outlets.
  const funnel = await pool.query<{
    bound_to_restaurant: number;
  }>(`
    SELECT COUNT(DISTINCT user_id)::int AS bound_to_restaurant
    FROM customer_events
    WHERE restaurant_id IS NOT NULL
  `);
  const summaryRow = summary.rows[0];
  summaryRow.bound_to_restaurant = funnel.rows[0].bound_to_restaurant;
  // Tony 2026-05-21: per-restaurant rollup pinned to dashboard top.
  // Counts the modern event types (bind / invoice_redeem / roll / reward_*) —
  // the old `activate` event from the deprecated /admin/tables flow is no
  // longer the source of truth. Also LEFT JOIN restaurants to surface all 5
  // outlets even when they have zero events (HAWKER + BLT33 currently).
  const byRestaurant = await pool.query(`
    SELECT r.id AS restaurant_id,
           r.name_zh,
           r.name_en,
           COALESCE(s.unique_visitors, 0)::int  AS unique_visitors,
           COALESCE(s.binds, 0)::int            AS binds,
           COALESCE(s.redeems, 0)::int          AS redeems,
           COALESCE(s.rolls, 0)::int            AS rolls,
           COALESCE(s.rewards, 0)::int          AS rewards,
           COALESCE(s.spend, 0)::int            AS spend
    FROM restaurants r
    LEFT JOIN (
      SELECT restaurant_id,
             COUNT(DISTINCT user_id)::int                                      AS unique_visitors,
             COUNT(*) FILTER (WHERE event_type='bind')::int                    AS binds,
             COUNT(*) FILTER (WHERE event_type='invoice_redeem')::int          AS redeems,
             COUNT(*) FILTER (WHERE event_type='roll')::int                    AS rolls,
             COUNT(*) FILTER (WHERE event_type IN ('reward_lottery','reward_fixed'))::int AS rewards,
             COALESCE(SUM(amount) FILTER (WHERE event_type='invoice_redeem'),0)::int AS spend
      FROM customer_events
      WHERE restaurant_id IS NOT NULL
      GROUP BY restaurant_id
    ) s ON s.restaurant_id = r.id
    ORDER BY r.id
  `);
  res.json({ summary: summaryRow, by_restaurant: byRestaurant.rows });
});

export default router;
