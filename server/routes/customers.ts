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

const staffAuth = [liffAuth, requireStaffWhitelist];

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

router.get("/", ...staffAuth, async (req, res) => {
  const sortCol = ALLOWED_SORTS.has(String(req.query.sort)) ? String(req.query.sort) : "last_seen_at";
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  const limit = Math.min(200, parseInt(String(req.query.limit), 10) || 50);
  const offset = Math.max(0, parseInt(String(req.query.offset), 10) || 0);
  const since = typeof req.query.since === "string" ? req.query.since : null;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : null;

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

router.get("/:userId", ...staffAuth, async (req, res) => {
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

router.get("/export.csv", ...staffAuth, async (req, res) => {
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

router.get("/_stats/overview", ...staffAuth, async (_req, res) => {
  const summary = await pool.query(`
    SELECT
      COUNT(*)::int AS total_customers,
      COUNT(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '7 days')::int AS active_7d,
      COUNT(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '30 days')::int AS active_30d,
      COUNT(*) FILTER (WHERE total_visits > 0)::int AS has_visited,
      COALESCE(SUM(total_spend), 0)::int AS total_spend,
      COALESCE(SUM(total_dice_rolled), 0)::int AS total_rolls,
      COALESCE(SUM(total_rewards_earned), 0)::int AS total_rewards
    FROM customer_profiles
  `);
  const byRestaurant = await pool.query(`
    SELECT restaurant_id,
           COUNT(DISTINCT user_id)::int AS unique_visitors,
           COUNT(*) FILTER (WHERE event_type='activate')::int AS visits,
           COALESCE(SUM(amount) FILTER (WHERE event_type='activate'), 0)::int AS spend
    FROM customer_events
    WHERE restaurant_id IS NOT NULL
    GROUP BY restaurant_id
    ORDER BY spend DESC
  `);
  res.json({ summary: summary.rows[0], by_restaurant: byRestaurant.rows });
});

export default router;
