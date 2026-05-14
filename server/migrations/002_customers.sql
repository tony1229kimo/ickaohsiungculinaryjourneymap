-- ─────────────────────────────────────────────────────────────────
-- Migration 002: Customer profile + event audit log
-- See TABLE_FLOW_SPEC.md (to be updated) for full design rationale.
--
-- Purpose: capture marketing-grade data on every LINE user who plays:
--   - profile: cumulative stats (visits, spend, last seen)
--   - events: every binding/activate/roll/reward in append-only log
--
-- This is the foundation for the future /admin/customers dashboard and
-- CSV export. Today we just collect; UI comes later.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id              TEXT PRIMARY KEY,
  display_name         TEXT,
  picture_url          TEXT,
  first_seen_at        TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at         TEXT NOT NULL DEFAULT (datetime('now')),
  total_visits         INTEGER NOT NULL DEFAULT 0,
  total_spend          INTEGER NOT NULL DEFAULT 0,
  total_dice_rolled    INTEGER NOT NULL DEFAULT 0,
  total_rewards_earned INTEGER NOT NULL DEFAULT 0,
  total_seasons        INTEGER NOT NULL DEFAULT 0,   -- how many "lap" completions (reached 15)
  notes                TEXT
);

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen
  ON customer_profiles(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS customer_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  -- Known types:
  --   bind            user scanned table QR, joined LINE OA
  --   activate        staff issued dice from a bill
  --   roll            user rolled the dice (server-authoritative)
  --   reward_lottery  user got a lottery card prize on a chance/fate tile
  --   reward_fixed    user claimed a fixed-tile reward (NT$500 etc.)
  --   season_reset    cross-season reset triggered on activate after reaching tile 15
  --   invoice_redeem  user scanned an invoice and got dice (Phase 5, future)
  payload       TEXT,         -- JSON, schema depends on event_type
  restaurant_id TEXT,
  amount        INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_user_time
  ON customer_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_type_time
  ON customer_events(event_type, created_at DESC);
