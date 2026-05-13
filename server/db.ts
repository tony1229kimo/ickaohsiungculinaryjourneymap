import initSqlJs, { type Database } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || path.join(import.meta.dirname, "game.db");

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

  persistDb();
  return db;
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
