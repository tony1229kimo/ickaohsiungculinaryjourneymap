import initSqlJs, { type Database } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || path.join(import.meta.dirname, "game.db");
const MIGRATIONS_DIR = path.join(import.meta.dirname, "migrations");

let db: Database;

export async function initDb(): Promise<Database> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS game_state (
      user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      total_points INTEGER NOT NULL DEFAULT 0,
      earned_rewards TEXT NOT NULL DEFAULT '[]',
      selected_character TEXT DEFAULT NULL,
      claimed_tiles TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  runMigrations();

  persistDb();
  return db;
}

// Run any .sql files in /migrations alphabetically.
// They MUST be idempotent (use CREATE TABLE IF NOT EXISTS / INSERT OR IGNORE)
// because we re-run on every startup — there's no migrations-applied tracking
// table yet. Good enough for in-memory sql.js where the DB is per-deploy.
function runMigrations(): void {
  if (!fs.existsSync(MIGRATIONS_DIR)) return;
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
      db.run(sql);
      console.log(`[db] applied migration: ${file}`);
    } catch (err) {
      console.error(`[db] migration ${file} failed:`, err);
    }
  }
}

function persistDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export interface GameState {
  userId: string;
  displayName: string;
  totalPoints: number;
  earnedRewards: unknown[];
  selectedCharacter: unknown | null;
  claimedTiles: number[];
}

export function getGameState(userId: string): GameState | null {
  const stmt = db.prepare("SELECT * FROM game_state WHERE user_id = ?");
  stmt.bind([userId]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();

  return {
    userId: row.user_id as string,
    displayName: row.display_name as string,
    totalPoints: row.total_points as number,
    earnedRewards: JSON.parse(row.earned_rewards as string),
    selectedCharacter: row.selected_character ? JSON.parse(row.selected_character as string) : null,
    claimedTiles: JSON.parse(row.claimed_tiles as string),
  };
}

export function saveGameState(state: GameState): void {
  // Diff earned_rewards vs current to detect new lottery prizes and emit events.
  // Client sends the whole array each save; we record one event per new entry.
  const before = getGameState(state.userId);
  const beforeRewards = (before?.earnedRewards as unknown[]) ?? [];
  const newRewards = state.earnedRewards.slice(beforeRewards.length);

  db.run(
    `INSERT INTO game_state (user_id, display_name, total_points, earned_rewards, selected_character, claimed_tiles, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       display_name = excluded.display_name,
       total_points = excluded.total_points,
       earned_rewards = excluded.earned_rewards,
       selected_character = excluded.selected_character,
       claimed_tiles = excluded.claimed_tiles,
       updated_at = datetime('now')`,
    [
      state.userId,
      state.displayName,
      state.totalPoints,
      JSON.stringify(state.earnedRewards),
      state.selectedCharacter ? JSON.stringify(state.selectedCharacter) : null,
      JSON.stringify(state.claimedTiles),
    ]
  );
  persistDb();

  // Sync display_name onto profile if client just told us
  if (state.displayName) {
    upsertProfile(state.userId, state.displayName);
  }
  // One event per newly added lottery reward
  for (const r of newRewards) {
    recordEvent({
      userId: state.userId,
      eventType: "reward_lottery",
      payload: r as Record<string, unknown>,
    });
  }
}

export function claimTile(userId: string, tile: number): { success: boolean; alreadyClaimed: boolean } {
  const state = getGameState(userId);
  if (!state) return { success: false, alreadyClaimed: false };

  const claimed: number[] = state.claimedTiles;
  if (claimed.includes(tile)) {
    return { success: false, alreadyClaimed: true };
  }

  claimed.push(tile);
  db.run(
    "UPDATE game_state SET claimed_tiles = ?, updated_at = datetime('now') WHERE user_id = ?",
    [JSON.stringify(claimed), userId]
  );
  persistDb();

  // Audit: fixed-tile reward claim (tiles 2/6/8/11/15 in StampCard.tsx).
  // Lottery rewards (chance/fate cards) go through saveGameState's
  // earned_rewards diff — see saveGameState below.
  recordEvent({
    userId,
    eventType: "reward_fixed",
    payload: { tile },
  });

  return { success: true, alreadyClaimed: false };
}

export function resetGame(userId: string): void {
  // Full reset — wipe progress AND earned rewards, so admins can clean-slate a test account.
  // Previously only points/tiles were cleared, leaving stale earned_rewards that would accumulate on replay.
  db.run(
    `UPDATE game_state
     SET total_points = 0,
         claimed_tiles = '[]',
         earned_rewards = '[]',
         updated_at = datetime('now')
     WHERE user_id = ?`,
    [userId]
  );
  persistDb();
}

// ─────────────────────────────────────────────────────────────────
// B-plan: table flow helpers
// See TABLE_FLOW_SPEC.md §3, §5 for the underlying design.
// ─────────────────────────────────────────────────────────────────

const BINDING_TTL_MIN = 30; // how long a binding survives without activation

export function tableExists(tableId: string): boolean {
  const stmt = db.prepare("SELECT 1 FROM tables WHERE id = ?");
  stmt.bind([tableId]);
  const found = stmt.step();
  stmt.free();
  return found;
}

/**
 * Bind a LINE user to a table. Called from the webhook when someone scans
 * the table-side QR and the bot receives "table:XX".
 *
 * Inserts a fresh binding row each time — history is preserved for audit.
 * Multiple users can co-bind the same table within the TTL window; the
 * "latest non-consumed binding" wins when staff activates (see activateTable).
 *
 * @returns true if the table exists and the binding was inserted; false otherwise.
 */
export function bindTableUser(tableId: string, userId: string): boolean {
  if (!tableExists(tableId)) return false;

  db.run(
    `INSERT INTO table_bindings (table_id, user_id, expires_at)
     VALUES (?, ?, datetime('now', ?))`,
    [tableId, userId, `+${BINDING_TTL_MIN} minutes`],
  );
  // Mark table as bound so the admin UI can show it as actionable.
  db.run(
    `UPDATE tables SET state = 'bound', state_changed_at = datetime('now')
     WHERE id = ? AND state IN ('idle', 'bound')`,
    [tableId],
  );
  persistDb();
  return true;
}

export interface BindingRow {
  id: number;
  table_id: string;
  user_id: string;
  bound_at: string;
}

/**
 * The single active binding that wins activation:
 * latest non-consumed, non-expired binding for the table.
 *
 * Tony's design rule (2026-05-14): "人數不管,結帳金額為主" — implies the
 * receiving user is whoever was bound last. If guests at the same table want
 * separate dice, they should split the bill (staff hits activate per check).
 */
export function getActiveBinding(tableId: string): BindingRow | null {
  const stmt = db.prepare(
    `SELECT id, table_id, user_id, bound_at FROM table_bindings
     WHERE table_id = ?
       AND consumed_at IS NULL
       AND datetime(expires_at) > datetime('now')
     ORDER BY datetime(bound_at) DESC
     LIMIT 1`,
  );
  stmt.bind([tableId]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return {
    id: row.id as number,
    table_id: row.table_id as string,
    user_id: row.user_id as string,
    bound_at: row.bound_at as string,
  };
}

export interface RestaurantRow {
  id: string;
  hotel_id: string;
  code: string;
  name_zh: string;
  name_en: string;
}

export function listRestaurants(hotelId: string | null = null): RestaurantRow[] {
  const sql = hotelId
    ? "SELECT * FROM restaurants WHERE hotel_id = ? ORDER BY id"
    : "SELECT * FROM restaurants ORDER BY hotel_id, id";
  const stmt = db.prepare(sql);
  if (hotelId) stmt.bind([hotelId]);
  const out: RestaurantRow[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    out.push({
      id: row.id as string,
      hotel_id: row.hotel_id as string,
      code: row.code as string,
      name_zh: row.name_zh as string,
      name_en: row.name_en as string,
    });
  }
  stmt.free();
  return out;
}

export interface TableRow {
  id: string;
  restaurant_id: string;
  display_label: string;
  state: "idle" | "bound" | "activated" | "cooldown";
  state_changed_at: string;
  active_user_id: string | null; // populated if state='bound' and active binding exists
  bound_at: string | null;
}

export function listRestaurantTables(restaurantId: string): TableRow[] {
  const stmt = db.prepare(
    `SELECT t.id, t.restaurant_id, t.display_label, t.state, t.state_changed_at,
            b.user_id AS active_user_id, b.bound_at AS bound_at
     FROM tables t
     LEFT JOIN (
       SELECT table_id, user_id, bound_at,
              ROW_NUMBER() OVER (PARTITION BY table_id ORDER BY datetime(bound_at) DESC) AS rn
       FROM table_bindings
       WHERE consumed_at IS NULL
         AND datetime(expires_at) > datetime('now')
     ) b ON b.table_id = t.id AND b.rn = 1
     WHERE t.restaurant_id = ?
     ORDER BY t.id`,
  );
  stmt.bind([restaurantId]);
  const out: TableRow[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    out.push({
      id: row.id as string,
      restaurant_id: row.restaurant_id as string,
      display_label: row.display_label as string,
      state: row.state as TableRow["state"],
      state_changed_at: row.state_changed_at as string,
      active_user_id: (row.active_user_id as string | null) ?? null,
      bound_at: (row.bound_at as string | null) ?? null,
    });
  }
  stmt.free();
  return out;
}

export interface ActivateResult {
  ok: boolean;
  reason?: "no_active_binding" | "table_not_found";
  userId?: string;
  diceIssued?: number;
  poolId?: number;
}

/**
 * Atomically: consume the active binding + insert a dice_pool row + flip
 * the table state to 'activated'. Returns the binding userId so the route
 * handler can call linePush.
 */
export function activateTable(
  tableId: string,
  amount: number,
  diceIssued: number,
  staffUserId: string,
): ActivateResult {
  if (!tableExists(tableId)) {
    return { ok: false, reason: "table_not_found" };
  }
  const binding = getActiveBinding(tableId);
  if (!binding) {
    return { ok: false, reason: "no_active_binding" };
  }

  // Get restaurant_id for the dice_pool row.
  const tStmt = db.prepare("SELECT restaurant_id FROM tables WHERE id = ?");
  tStmt.bind([tableId]);
  tStmt.step();
  const restaurantId = (tStmt.getAsObject().restaurant_id as string) ?? "";
  tStmt.free();

  // Check if customer needs cross-season reset (Tony 2026-05-14: option A).
  // If they already reached the finish line (15), wipe progress for a new
  // lap but keep earned_rewards as historical record.
  const existing = getGameState(binding.user_id);
  const needsSeasonReset = !!existing && existing.totalPoints >= 15;

  db.run("BEGIN TRANSACTION");
  try {
    db.run(
      `UPDATE table_bindings SET consumed_at = datetime('now') WHERE id = ?`,
      [binding.id],
    );

    if (needsSeasonReset) {
      // Start a fresh season: zero position + tile flags, keep rewards history
      db.run(
        `UPDATE game_state
         SET total_points = 0, claimed_tiles = '[]', updated_at = datetime('now')
         WHERE user_id = ?`,
        [binding.user_id],
      );
    }

    db.run(
      `INSERT INTO dice_pool
         (user_id, restaurant_id, dice_remaining, amount_spent, issued_by_staff_id, table_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [binding.user_id, restaurantId, diceIssued, amount, staffUserId, tableId],
    );
    // Read back the last inserted rowid for the pool.
    const poolStmt = db.prepare("SELECT last_insert_rowid() AS id");
    poolStmt.step();
    const poolId = poolStmt.getAsObject().id as number;
    poolStmt.free();

    db.run(
      `UPDATE tables SET state = 'activated', state_changed_at = datetime('now')
       WHERE id = ?`,
      [tableId],
    );
    db.run(
      `INSERT INTO staff_actions (staff_user_id, action, table_id, payload)
       VALUES (?, 'activate', ?, ?)`,
      [
        staffUserId,
        tableId,
        JSON.stringify({ amount, dice: diceIssued, user_id: binding.user_id, season_reset: needsSeasonReset }),
      ],
    );

    db.run("COMMIT");
    persistDb();

    // Audit events (outside transaction — recordEvent persists itself)
    if (needsSeasonReset) {
      recordEvent({
        userId: binding.user_id,
        eventType: "season_reset",
        restaurantId,
      });
    }
    recordEvent({
      userId: binding.user_id,
      eventType: "activate",
      restaurantId,
      amount,
      payload: { table_id: tableId, dice_issued: diceIssued },
    });

    return { ok: true, userId: binding.user_id, diceIssued, poolId };
  } catch (err) {
    db.run("ROLLBACK");
    console.error("[activateTable] failed:", err);
    return { ok: false, reason: "table_not_found" };
  }
}

/**
 * Total dice remaining for a user across all non-exhausted pools.
 * FIFO consumption (oldest pool first) is handled by takeOneDice below.
 */
export function getDiceRemaining(userId: string): number {
  const stmt = db.prepare(
    `SELECT COALESCE(SUM(dice_remaining), 0) AS total
     FROM dice_pool
     WHERE user_id = ? AND exhausted_at IS NULL AND dice_remaining > 0`,
  );
  stmt.bind([userId]);
  stmt.step();
  const total = stmt.getAsObject().total as number;
  stmt.free();
  return total;
}

export interface DicePoolRow {
  id: number;
  user_id: string;
  restaurant_id: string;
  dice_remaining: number;
  issued_at: string;
}

/**
 * Atomically decrement one dice from the oldest active pool.
 * Returns null if no dice are available.
 */
export function takeOneDice(userId: string): { poolId: number; remaining: number } | null {
  const stmt = db.prepare(
    `SELECT id, dice_remaining FROM dice_pool
     WHERE user_id = ? AND exhausted_at IS NULL AND dice_remaining > 0
     ORDER BY datetime(issued_at) ASC
     LIMIT 1`,
  );
  stmt.bind([userId]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();

  const poolId = row.id as number;
  const newRemaining = (row.dice_remaining as number) - 1;

  db.run(
    `UPDATE dice_pool
     SET dice_remaining = ?, exhausted_at = CASE WHEN ? = 0 THEN datetime('now') ELSE exhausted_at END
     WHERE id = ?`,
    [newRemaining, newRemaining, poolId],
  );
  persistDb();

  // Audit: record the roll. restaurant_id pulled from the pool row so we
  // can later answer "how many rolls happened at each restaurant".
  const rStmt = db.prepare("SELECT restaurant_id FROM dice_pool WHERE id = ?");
  rStmt.bind([poolId]);
  rStmt.step();
  const restaurantId = (rStmt.getAsObject().restaurant_id as string) ?? null;
  rStmt.free();
  recordEvent({
    userId,
    eventType: "roll",
    restaurantId,
    payload: { pool_id: poolId, remaining_after: newRemaining },
  });

  return { poolId, remaining: newRemaining };
}

export function isStaff(userId: string): boolean {
  const stmt = db.prepare("SELECT 1 FROM staff_whitelist WHERE user_id = ?");
  stmt.bind([userId]);
  const found = stmt.step();
  stmt.free();
  return found;
}

// ─────────────────────────────────────────────────────────────────
// Customer profile + event audit (migration 002)
// ─────────────────────────────────────────────────────────────────

/**
 * UPSERT a customer profile. Called every time we see a LINE user
 * (bind, LIFF login, etc.). Updates display_name/picture_url if newer
 * data available and refreshes last_seen_at.
 */
export function upsertProfile(
  userId: string,
  displayName?: string | null,
  pictureUrl?: string | null,
): void {
  db.run(
    `INSERT INTO customer_profiles (user_id, display_name, picture_url, last_seen_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       display_name = COALESCE(?, customer_profiles.display_name),
       picture_url = COALESCE(?, customer_profiles.picture_url),
       last_seen_at = datetime('now')`,
    [userId, displayName ?? null, pictureUrl ?? null, displayName ?? null, pictureUrl ?? null],
  );
  // persist deferred — caller often does several writes in a transaction
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

/**
 * Append an event + bump the relevant aggregate counter on the profile.
 *
 * Aggregate buckets are derived from event_type so /admin/customers can
 * sort by them without scanning events. Source of truth remains the events
 * table — profile counters are denormalised for read speed.
 */
export function recordEvent(opts: RecordEventOpts): void {
  upsertProfile(opts.userId); // make sure profile exists

  db.run(
    `INSERT INTO customer_events (user_id, event_type, payload, restaurant_id, amount)
     VALUES (?, ?, ?, ?, ?)`,
    [
      opts.userId,
      opts.eventType,
      opts.payload ? JSON.stringify(opts.payload) : null,
      opts.restaurantId ?? null,
      opts.amount ?? null,
    ],
  );

  // Bump denormalised counters
  if (opts.eventType === "activate") {
    db.run(
      `UPDATE customer_profiles
       SET total_visits = total_visits + 1,
           total_spend = total_spend + ?
       WHERE user_id = ?`,
      [opts.amount ?? 0, opts.userId],
    );
  } else if (opts.eventType === "roll") {
    db.run(
      `UPDATE customer_profiles SET total_dice_rolled = total_dice_rolled + 1 WHERE user_id = ?`,
      [opts.userId],
    );
  } else if (opts.eventType === "reward_lottery" || opts.eventType === "reward_fixed") {
    db.run(
      `UPDATE customer_profiles SET total_rewards_earned = total_rewards_earned + 1 WHERE user_id = ?`,
      [opts.userId],
    );
  } else if (opts.eventType === "season_reset") {
    db.run(
      `UPDATE customer_profiles SET total_seasons = total_seasons + 1 WHERE user_id = ?`,
      [opts.userId],
    );
  }
  persistDb();
}
