-- ─────────────────────────────────────────────────────────────────
-- Migration 002 (Postgres): customer profile + event audit
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id              TEXT PRIMARY KEY,
  display_name         TEXT,
  picture_url          TEXT,
  first_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_visits         INTEGER NOT NULL DEFAULT 0,
  total_spend          INTEGER NOT NULL DEFAULT 0,
  total_dice_rolled    INTEGER NOT NULL DEFAULT 0,
  total_rewards_earned INTEGER NOT NULL DEFAULT 0,
  total_seasons        INTEGER NOT NULL DEFAULT 0,
  notes                TEXT
);

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen
  ON customer_profiles(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS customer_events (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  payload       JSONB,
  restaurant_id TEXT,
  amount        INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_time
  ON customer_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_type_time
  ON customer_events(event_type, created_at DESC);
