/**
 * Postgres backend (Phase 6).
 *
 * Replaces the in-memory sql.js layer used in Phase 1-5. That layer lost all
 * data on every redeploy, which made the customer_profiles / customer_events
 * audit log effectively useless. Postgres lives in its own Zeabur service
 * and survives backend redeploys.
 *
 * Connection: DATABASE_URL env var (set by Zeabur dashboard, see scripts/).
 * SSL: disabled on Zeabur internal network (postgresql.zeabur.internal).
 *
 * All helpers are async — callers must await.
 */

import { Pool, type PoolClient } from "pg";
import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(import.meta.dirname, "migrations");

let pool: Pool;

export async function initDb(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not set — Postgres connection required");
  }

  pool = new Pool({
    connectionString,
    // Zeabur internal network = no SSL. Set PGSSLMODE=require if proxying through public.
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  // Smoke: verify connection
  const r = await pool.query("SELECT 1 AS ok");
  if (r.rows[0].ok !== 1) throw new Error("Postgres smoke failed");

  // Tables — keep game_state baseline schema inline so a fresh DB works.
  // Other tables come from migrations/ run below.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_state (
      user_id            TEXT PRIMARY KEY,
      display_name       TEXT NOT NULL DEFAULT '',
      total_points       INTEGER NOT NULL DEFAULT 0,
      earned_rewards     JSONB NOT NULL DEFAULT '[]'::jsonb,
      selected_character JSONB,
      claimed_tiles      JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await runMigrations();
  console.log("[db] Postgres ready");
}

async function runMigrations(): Promise<void> {
  if (!fs.existsSync(MIGRATIONS_DIR)) return;
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
      await pool.query(sql);
      console.log(`[db] applied migration: ${file}`);
    } catch (err) {
      console.error(`[db] migration ${file} failed:`, err);
      // Continue — most migrations are idempotent, single failure shouldn't bring down boot
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Game state
// ─────────────────────────────────────────────────────────────────

export interface GameState {
  userId: string;
  displayName: string;
  totalPoints: number;
  earnedRewards: unknown[];
  selectedCharacter: unknown | null;
  claimedTiles: number[];
}

export async function getGameState(userId: string): Promise<GameState | null> {
  const r = await pool.query(
    `SELECT user_id, display_name, total_points, earned_rewards, selected_character, claimed_tiles
     FROM game_state WHERE user_id = $1`,
    [userId],
  );
  if (r.rowCount === 0) return null;
  const row = r.rows[0];
  return {
    userId: row.user_id,
    displayName: row.display_name,
    totalPoints: row.total_points,
    // pg returns JSONB as parsed JS; defensive in case it comes as string
    earnedRewards: typeof row.earned_rewards === "string" ? JSON.parse(row.earned_rewards) : row.earned_rewards,
    selectedCharacter: typeof row.selected_character === "string" ? JSON.parse(row.selected_character) : row.selected_character,
    claimedTiles: typeof row.claimed_tiles === "string" ? JSON.parse(row.claimed_tiles) : row.claimed_tiles,
  };
}

export async function saveGameState(state: GameState): Promise<void> {
  // Diff earned_rewards to detect new lottery prizes for audit log
  const before = await getGameState(state.userId);
  const beforeRewards = (before?.earnedRewards as unknown[]) ?? [];
  const newRewards = state.earnedRewards.slice(beforeRewards.length);

  await pool.query(
    `INSERT INTO game_state (user_id, display_name, total_points, earned_rewards, selected_character, claimed_tiles, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       total_points = EXCLUDED.total_points,
       earned_rewards = EXCLUDED.earned_rewards,
       selected_character = EXCLUDED.selected_character,
       claimed_tiles = EXCLUDED.claimed_tiles,
       updated_at = NOW()`,
    [
      state.userId,
      state.displayName,
      state.totalPoints,
      JSON.stringify(state.earnedRewards),
      state.selectedCharacter ? JSON.stringify(state.selectedCharacter) : null,
      JSON.stringify(state.claimedTiles),
    ],
  );

  if (state.displayName) await upsertProfile(state.userId, state.displayName);

  for (const r of newRewards) {
    await recordEvent({
      userId: state.userId,
      eventType: "reward_lottery",
      payload: r as Record<string, unknown>,
    });
  }
}

export async function claimTile(userId: string, tile: number): Promise<{ success: boolean; alreadyClaimed: boolean }> {
  const state = await getGameState(userId);
  if (!state) return { success: false, alreadyClaimed: false };
  const claimed = state.claimedTiles;
  if (claimed.includes(tile)) return { success: false, alreadyClaimed: true };
  claimed.push(tile);
  await pool.query(
    `UPDATE game_state SET claimed_tiles = $1::jsonb, updated_at = NOW() WHERE user_id = $2`,
    [JSON.stringify(claimed), userId],
  );
  await recordEvent({ userId, eventType: "reward_fixed", payload: { tile } });
  return { success: true, alreadyClaimed: false };
}

export async function resetGame(userId: string): Promise<void> {
  await pool.query(
    `UPDATE game_state
     SET total_points = 0, claimed_tiles = '[]'::jsonb, earned_rewards = '[]'::jsonb, updated_at = NOW()
     WHERE user_id = $1`,
    [userId],
  );
}

// ─────────────────────────────────────────────────────────────────
// Tables / bindings (migration 001)
// ─────────────────────────────────────────────────────────────────

const BINDING_TTL_MIN = 30;

export async function tableExists(tableId: string): Promise<boolean> {
  const r = await pool.query(`SELECT 1 FROM tables WHERE id = $1`, [tableId]);
  return (r.rowCount ?? 0) > 0;
}

export async function bindTableUser(tableId: string, userId: string): Promise<boolean> {
  if (!await tableExists(tableId)) return false;
  await pool.query(
    `INSERT INTO table_bindings (table_id, user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)`,
    [tableId, userId, String(BINDING_TTL_MIN)],
  );
  await pool.query(
    `UPDATE tables SET state = 'bound', state_changed_at = NOW()
     WHERE id = $1 AND state IN ('idle','bound')`,
    [tableId],
  );
  return true;
}

export interface BindingRow {
  id: number;
  table_id: string;
  user_id: string;
  bound_at: string;
}

export async function getActiveBinding(tableId: string): Promise<BindingRow | null> {
  const r = await pool.query(
    `SELECT id, table_id, user_id, bound_at FROM table_bindings
     WHERE table_id = $1
       AND consumed_at IS NULL
       AND expires_at > NOW()
     ORDER BY bound_at DESC
     LIMIT 1`,
    [tableId],
  );
  return r.rowCount === 0 ? null : r.rows[0];
}

export interface RestaurantRow {
  id: string;
  hotel_id: string;
  code: string;
  name_zh: string;
  name_en: string;
}

export async function listRestaurants(hotelId: string | null = null): Promise<RestaurantRow[]> {
  const r = hotelId
    ? await pool.query(`SELECT * FROM restaurants WHERE hotel_id = $1 ORDER BY id`, [hotelId])
    : await pool.query(`SELECT * FROM restaurants ORDER BY hotel_id, id`);
  return r.rows;
}

export interface TableRow {
  id: string;
  restaurant_id: string;
  display_label: string;
  state: "idle" | "bound" | "activated" | "cooldown";
  state_changed_at: string;
  active_user_id: string | null;
  bound_at: string | null;
}

export async function listRestaurantTables(restaurantId: string): Promise<TableRow[]> {
  const r = await pool.query(
    `SELECT t.id, t.restaurant_id, t.display_label, t.state, t.state_changed_at,
            b.user_id AS active_user_id, b.bound_at AS bound_at
     FROM tables t
     LEFT JOIN LATERAL (
       SELECT user_id, bound_at FROM table_bindings
       WHERE table_id = t.id AND consumed_at IS NULL AND expires_at > NOW()
       ORDER BY bound_at DESC LIMIT 1
     ) b ON TRUE
     WHERE t.restaurant_id = $1
     ORDER BY t.id`,
    [restaurantId],
  );
  return r.rows;
}

// ─────────────────────────────────────────────────────────────────
// Activate table (cross-season reset) + dice pool
// ─────────────────────────────────────────────────────────────────

export interface ActivateResult {
  ok: boolean;
  reason?: "no_active_binding" | "table_not_found";
  userId?: string;
  diceIssued?: number;
  poolId?: number;
}

export async function activateTable(
  tableId: string,
  amount: number,
  diceIssued: number,
  staffUserId: string,
): Promise<ActivateResult> {
  if (!await tableExists(tableId)) return { ok: false, reason: "table_not_found" };
  const binding = await getActiveBinding(tableId);
  if (!binding) return { ok: false, reason: "no_active_binding" };

  const rRest = await pool.query(`SELECT restaurant_id FROM tables WHERE id = $1`, [tableId]);
  const restaurantId = rRest.rows[0]?.restaurant_id ?? "";

  const existing = await getGameState(binding.user_id);
  const needsSeasonReset = !!existing && existing.totalPoints >= 15;

  const client = await pool.connect();
  let poolId = 0;
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE table_bindings SET consumed_at = NOW() WHERE id = $1`, [binding.id]);
    if (needsSeasonReset) {
      await client.query(
        `UPDATE game_state SET total_points = 0, claimed_tiles = '[]'::jsonb, updated_at = NOW() WHERE user_id = $1`,
        [binding.user_id],
      );
    }
    const ins = await client.query(
      `INSERT INTO dice_pool (user_id, restaurant_id, dice_remaining, amount_spent, issued_by_staff_id, table_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [binding.user_id, restaurantId, diceIssued, amount, staffUserId, tableId],
    );
    poolId = ins.rows[0].id;
    await client.query(
      `UPDATE tables SET state = 'activated', state_changed_at = NOW() WHERE id = $1`,
      [tableId],
    );
    await client.query(
      `INSERT INTO staff_actions (staff_user_id, action, table_id, payload)
       VALUES ($1, 'activate', $2, $3::jsonb)`,
      [staffUserId, tableId, JSON.stringify({ amount, dice: diceIssued, user_id: binding.user_id, season_reset: needsSeasonReset })],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[activateTable] failed:", err);
    client.release();
    return { ok: false, reason: "table_not_found" };
  }
  client.release();

  if (needsSeasonReset) {
    await recordEvent({ userId: binding.user_id, eventType: "season_reset", restaurantId });
  }
  await recordEvent({
    userId: binding.user_id,
    eventType: "activate",
    restaurantId,
    amount,
    payload: { table_id: tableId, dice_issued: diceIssued },
  });

  return { ok: true, userId: binding.user_id, diceIssued, poolId };
}

export async function getDiceRemaining(userId: string): Promise<number> {
  const r = await pool.query(
    `SELECT COALESCE(SUM(dice_remaining), 0)::int AS total
     FROM dice_pool WHERE user_id = $1 AND exhausted_at IS NULL AND dice_remaining > 0`,
    [userId],
  );
  return r.rows[0].total;
}

export async function takeOneDice(userId: string): Promise<{ poolId: number; remaining: number } | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sel = await client.query(
      `SELECT id, dice_remaining, restaurant_id FROM dice_pool
       WHERE user_id = $1 AND exhausted_at IS NULL AND dice_remaining > 0
       ORDER BY issued_at ASC LIMIT 1 FOR UPDATE`,
      [userId],
    );
    if (sel.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return null;
    }
    const row = sel.rows[0];
    const newRemaining = row.dice_remaining - 1;
    await client.query(
      `UPDATE dice_pool
       SET dice_remaining = $1,
           exhausted_at = CASE WHEN $1 = 0 THEN NOW() ELSE exhausted_at END
       WHERE id = $2`,
      [newRemaining, row.id],
    );
    await client.query("COMMIT");
    client.release();

    await recordEvent({
      userId,
      eventType: "roll",
      restaurantId: row.restaurant_id,
      payload: { pool_id: row.id, remaining_after: newRemaining },
    });

    return { poolId: row.id, remaining: newRemaining };
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    console.error("[takeOneDice] failed:", err);
    return null;
  }
}

export async function isStaff(userId: string): Promise<boolean> {
  const r = await pool.query(`SELECT 1 FROM staff_whitelist WHERE user_id = $1`, [userId]);
  return (r.rowCount ?? 0) > 0;
}

// ─────────────────────────────────────────────────────────────────
// Invoice redeem (migration 003)
// ─────────────────────────────────────────────────────────────────

const BINDING_WINDOW_MIN = 60;
const DICE_PER_2000 = 2000;
const DICE_CAP = 5;

export interface ParsedInvoice {
  invoiceNo: string;
  invoiceDate: string;
  randomCode: string;
  amountSales: number;
  amountTotal: number;
  buyerVat: string;
  sellerVat: string;
}

export function parseInvoiceQR(raw: string): ParsedInvoice | null {
  if (typeof raw !== "string" || raw.length < 77) return null;
  const invoiceNo = raw.slice(0, 10);
  if (!/^[A-Z]{2}\d{8}$/i.test(invoiceNo)) return null;
  const invoiceDate = raw.slice(10, 17);
  const randomCode = raw.slice(17, 21);
  const salesHex = raw.slice(21, 29);
  const totalHex = raw.slice(29, 37);
  const buyerVat = raw.slice(37, 45);
  const sellerVat = raw.slice(45, 53);
  const amountSales = parseInt(salesHex, 16);
  const amountTotal = parseInt(totalHex, 16);
  if (!Number.isFinite(amountTotal) || amountTotal <= 0) return null;
  return {
    invoiceNo: invoiceNo.toUpperCase(),
    invoiceDate,
    randomCode,
    amountSales,
    amountTotal,
    buyerVat,
    sellerVat,
  };
}

export interface InvoiceRedeemResult {
  ok: boolean;
  reason?: "parse_failed" | "already_redeemed" | "no_active_binding" | "amount_below_threshold";
  diceIssued?: number;
  amount?: number;
  restaurantId?: string;
}

export async function redeemInvoice(userId: string, rawQR: string): Promise<InvoiceRedeemResult> {
  const parsed = parseInvoiceQR(rawQR);
  if (!parsed) return { ok: false, reason: "parse_failed" };

  const diceIssued = Math.min(Math.floor(parsed.amountTotal / DICE_PER_2000), DICE_CAP);
  if (diceIssued <= 0) {
    return { ok: false, reason: "amount_below_threshold", amount: parsed.amountTotal };
  }

  // active binding in last BINDING_WINDOW_MIN min
  const bind = await pool.query(
    `SELECT tb.table_id, t.restaurant_id FROM table_bindings tb
     JOIN tables t ON t.id = tb.table_id
     WHERE tb.user_id = $1 AND tb.bound_at > NOW() - ($2 || ' minutes')::interval
     ORDER BY tb.bound_at DESC LIMIT 1`,
    [userId, String(BINDING_WINDOW_MIN)],
  );
  if (bind.rowCount === 0) return { ok: false, reason: "no_active_binding" };
  const { table_id: tableId, restaurant_id: restaurantId } = bind.rows[0];

  const existing = await getGameState(userId);
  const needsSeasonReset = !!existing && existing.totalPoints >= 15;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO invoices
         (invoice_no, seller_vat, buyer_vat, amount_total, amount_sales,
          invoice_date, redeemed_by_userid, restaurant_id, table_id, dice_issued, raw_qr)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        parsed.invoiceNo, parsed.sellerVat, parsed.buyerVat,
        parsed.amountTotal, parsed.amountSales, parsed.invoiceDate,
        userId, restaurantId, tableId, diceIssued, rawQR.slice(0, 500),
      ],
    );
    if (needsSeasonReset) {
      await client.query(
        `UPDATE game_state SET total_points = 0, claimed_tiles = '[]'::jsonb, updated_at = NOW() WHERE user_id = $1`,
        [userId],
      );
    }
    await client.query(
      `INSERT INTO dice_pool (user_id, restaurant_id, dice_remaining, amount_spent, issued_by_staff_id, table_id)
       VALUES ($1, $2, $3, $4, 'self_invoice', $5)`,
      [userId, restaurantId, diceIssued, parsed.amountTotal, tableId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    const msg = err instanceof Error ? err.message : String(err);
    if (/duplicate key|unique constraint|already exists/i.test(msg)) {
      return { ok: false, reason: "already_redeemed" };
    }
    console.error("[redeemInvoice] error:", err);
    return { ok: false, reason: "parse_failed" };
  }
  client.release();

  if (needsSeasonReset) await recordEvent({ userId, eventType: "season_reset", restaurantId });
  await recordEvent({
    userId,
    eventType: "invoice_redeem",
    restaurantId,
    amount: parsed.amountTotal,
    payload: { invoice_no: parsed.invoiceNo, dice_issued: diceIssued, table_id: tableId },
  });

  return { ok: true, diceIssued, amount: parsed.amountTotal, restaurantId };
}

// ─────────────────────────────────────────────────────────────────
// Customer profile + event (migration 002)
// ─────────────────────────────────────────────────────────────────

export async function upsertProfile(
  userId: string,
  displayName?: string | null,
  pictureUrl?: string | null,
): Promise<void> {
  await pool.query(
    `INSERT INTO customer_profiles (user_id, display_name, picture_url, last_seen_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       display_name = COALESCE($2, customer_profiles.display_name),
       picture_url = COALESCE($3, customer_profiles.picture_url),
       last_seen_at = NOW()`,
    [userId, displayName ?? null, pictureUrl ?? null],
  );
}

export interface RecordEventOpts {
  userId: string;
  eventType:
    | "bind"
    | "activate"
    | "roll"
    | "reward_lottery"
    | "reward_fixed"
    | "season_reset"
    | "invoice_redeem";
  payload?: unknown;
  restaurantId?: string | null;
  amount?: number | null;
}

export async function recordEvent(opts: RecordEventOpts): Promise<void> {
  await upsertProfile(opts.userId);
  await pool.query(
    `INSERT INTO customer_events (user_id, event_type, payload, restaurant_id, amount)
     VALUES ($1, $2, $3::jsonb, $4, $5)`,
    [
      opts.userId,
      opts.eventType,
      opts.payload ? JSON.stringify(opts.payload) : null,
      opts.restaurantId ?? null,
      opts.amount ?? null,
    ],
  );
  if (opts.eventType === "activate") {
    await pool.query(
      `UPDATE customer_profiles SET total_visits = total_visits + 1, total_spend = total_spend + $1 WHERE user_id = $2`,
      [opts.amount ?? 0, opts.userId],
    );
  } else if (opts.eventType === "roll") {
    await pool.query(`UPDATE customer_profiles SET total_dice_rolled = total_dice_rolled + 1 WHERE user_id = $1`, [opts.userId]);
  } else if (opts.eventType === "reward_lottery" || opts.eventType === "reward_fixed") {
    await pool.query(`UPDATE customer_profiles SET total_rewards_earned = total_rewards_earned + 1 WHERE user_id = $1`, [opts.userId]);
  } else if (opts.eventType === "season_reset") {
    await pool.query(`UPDATE customer_profiles SET total_seasons = total_seasons + 1 WHERE user_id = $1`, [opts.userId]);
  }
}
