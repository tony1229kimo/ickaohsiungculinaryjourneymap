/**
 * Backfill empty display_name in customer_profiles.
 * Tony 2026-05-21 — one-off cleanup for the 32 existing rows that came in via
 * webhook follow / bind events before we started fetching LINE profiles.
 *
 * Run inside the backend container:
 *   tsx scripts/backfill-display-names.ts
 *
 * Or from local dev with proper env vars:
 *   DATABASE_URL=... LINE_MESSAGING_ACCESS_TOKEN_KH=... npx tsx server/scripts/backfill-display-names.ts
 *
 * Safe to re-run — only touches rows where display_name is NULL or empty.
 */

import { Pool } from "pg";

const LINE_PROFILE_URL = "https://api.line.me/v2/bot/profile";
const DB_URL = process.env.DATABASE_URL;
const LINE_TOKEN = process.env.LINE_MESSAGING_ACCESS_TOKEN_KH;
const DRY_RUN = process.argv.includes("--dry-run");

if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
if (!LINE_TOKEN) {
  console.error("LINE_MESSAGING_ACCESS_TOKEN_KH not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_URL,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
});

async function fetchProfile(userId: string): Promise<{ displayName?: string; pictureUrl?: string } | null> {
  try {
    const res = await fetch(`${LINE_PROFILE_URL}/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${LINE_TOKEN}` },
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`  [skip] LINE HTTP ${res.status} for ${userId}: ${errText.slice(0, 100)}`);
      return null;
    }
    return (await res.json()) as { displayName?: string; pictureUrl?: string };
  } catch (err) {
    console.warn(`  [skip] fetch failed for ${userId}:`, err);
    return null;
  }
}

async function main() {
  // Find profiles with no display name
  const r = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM customer_profiles
     WHERE display_name IS NULL OR display_name = ''
     ORDER BY first_seen_at ASC`,
  );
  const targets = r.rows;
  console.log(`Found ${targets.length} rows to backfill${DRY_RUN ? " (DRY RUN — no DB writes)" : ""}`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const userId = targets[i].user_id;
    process.stdout.write(`[${i + 1}/${targets.length}] ${userId.slice(0, 20)}... `);
    const prof = await fetchProfile(userId);
    if (!prof || !prof.displayName) {
      console.log("no name returned");
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`would update → "${prof.displayName}"`);
      updated++;
      continue;
    }
    try {
      await pool.query(
        `UPDATE customer_profiles
         SET display_name = $2, picture_url = COALESCE($3, picture_url)
         WHERE user_id = $1`,
        [userId, prof.displayName, prof.pictureUrl ?? null],
      );
      console.log(`updated → "${prof.displayName}"`);
      updated++;
    } catch (err) {
      console.warn("UPDATE failed:", err);
      failed++;
    }
    // Be gentle on the LINE API — pause 100 ms between calls.
    await new Promise((res) => setTimeout(res, 100));
  }

  console.log("\n──────────────────────────────────");
  console.log(`updated: ${updated}`);
  console.log(`skipped: ${skipped}`);
  console.log(`failed:  ${failed}`);
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
