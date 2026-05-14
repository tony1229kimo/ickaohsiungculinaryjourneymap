/**
 * Staff management — admin-token gated (NOT LIFF gated, so it can be used
 * to bootstrap the first staff member when staff_whitelist is empty).
 *
 * Endpoints:
 *   GET    /api/admin/profiles/recent       — list recent customer_profiles
 *   POST   /api/admin/staff                  — INSERT/UPDATE staff_whitelist
 *   GET    /api/admin/staff                  — list current staff
 *   DELETE /api/admin/staff/:userId          — remove staff
 *
 * Auth: X-Admin-Token header must match process.env.ADMIN_TOKEN.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { Pool } from "pg";

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
});

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: "ADMIN_TOKEN not configured" });
  }
  if (req.header("x-admin-token") !== expected) {
    return res.status(401).json({ error: "Invalid admin token" });
  }
  next();
}

// GET recent customer_profiles — helps the operator find their own LINE userId
// without poking around in Postgres directly. Returns 20 most recently active.
router.get("/profiles/recent", requireAdmin, async (_req, res) => {
  const r = await pool.query(`
    SELECT user_id, display_name, first_seen_at, last_seen_at,
           total_visits, total_spend
    FROM customer_profiles
    ORDER BY last_seen_at DESC
    LIMIT 20
  `);
  res.json({ profiles: r.rows });
});

// POST add or update a staff member
router.post("/staff", requireAdmin, async (req, res) => {
  const { user_id, name, role, restaurant_id } = req.body ?? {};
  if (!user_id || typeof user_id !== "string") {
    return res.status(400).json({ error: "user_id (string) required" });
  }
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name (string) required" });
  }
  const finalRole = role ?? "super_admin";
  try {
    await pool.query(
      `INSERT INTO staff_whitelist (user_id, name, role, restaurant_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         restaurant_id = EXCLUDED.restaurant_id`,
      [user_id, name, finalRole, restaurant_id ?? null],
    );
    res.json({ ok: true, user_id, name, role: finalRole, restaurant_id: restaurant_id ?? null });
  } catch (err) {
    console.error("[staffAdmin] add failed:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// GET current staff list
router.get("/staff", requireAdmin, async (_req, res) => {
  const r = await pool.query(
    `SELECT user_id, name, role, restaurant_id, added_at
     FROM staff_whitelist ORDER BY added_at DESC`,
  );
  res.json({ staff: r.rows });
});

// DELETE a staff member
router.delete("/staff/:userId", requireAdmin, async (req, res) => {
  const r = await pool.query(
    `DELETE FROM staff_whitelist WHERE user_id = $1`,
    [req.params.userId],
  );
  res.json({ ok: true, deleted: r.rowCount ?? 0 });
});

export default router;
