-- ─────────────────────────────────────────────────────────────────
-- Migration 001 (Postgres): hotels / restaurants / tables / bindings / dice / staff
-- Converted from sqlite syntax: SERIAL, JSONB, TIMESTAMPTZ, NOW(), ON CONFLICT
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hotels (
  id              TEXT PRIMARY KEY,
  name_zh         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  line_channel_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurants (
  id          TEXT PRIMARY KEY,
  hotel_id    TEXT NOT NULL REFERENCES hotels(id),
  code        TEXT NOT NULL,
  name_zh     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tables (
  id               TEXT PRIMARY KEY,
  restaurant_id    TEXT NOT NULL REFERENCES restaurants(id),
  display_label    TEXT NOT NULL,
  state            TEXT NOT NULL DEFAULT 'idle',
  state_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS table_bindings (
  id              SERIAL PRIMARY KEY,
  table_id        TEXT NOT NULL REFERENCES tables(id),
  user_id         TEXT NOT NULL,
  bound_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bindings_table_active
  ON table_bindings(table_id, consumed_at, expires_at);

CREATE TABLE IF NOT EXISTS dice_pool (
  id                  SERIAL PRIMARY KEY,
  user_id             TEXT NOT NULL,
  restaurant_id       TEXT NOT NULL REFERENCES restaurants(id),
  dice_remaining      INTEGER NOT NULL,
  amount_spent        INTEGER NOT NULL,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_by_staff_id  TEXT NOT NULL,
  table_id            TEXT REFERENCES tables(id),
  exhausted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dice_pool_user_active
  ON dice_pool(user_id, exhausted_at);

CREATE TABLE IF NOT EXISTS staff_actions (
  id              SERIAL PRIMARY KEY,
  staff_user_id   TEXT NOT NULL,
  staff_name      TEXT,
  action          TEXT NOT NULL,
  table_id        TEXT REFERENCES tables(id),
  payload         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_whitelist (
  user_id         TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,
  restaurant_id   TEXT REFERENCES restaurants(id),
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- Seed: IC 高雄 + 5 餐廳 + 150 桌
-- ─────────────────────────────────────────────────────────────────

INSERT INTO hotels (id, name_zh, name_en, line_channel_id) VALUES
  ('KH', '高雄洲際酒店', 'InterContinental Kaohsiung', '1656533531')
ON CONFLICT (id) DO NOTHING;

-- Clean up any leftover TBD placeholders from earlier migration revisions
DELETE FROM tables       WHERE restaurant_id IN ('A','B','C','D','E');
DELETE FROM restaurants  WHERE id IN ('A','B','C','D','E') AND code LIKE 'TBD-%';

INSERT INTO restaurants (id, hotel_id, code, name_zh, name_en) VALUES
  ('ZL', 'KH', 'ZHAN-LU', '湛露中餐廳',         'Zhan Lu Chinese'),
  ('WR', 'KH', 'WA-RA',   'WA-RA 日式餐廳',     'WA-RA Japanese'),
  ('SD', 'KH', 'SEEDS',   'SEEDS 大地全日餐廳', 'SEEDS All-Day Dining'),
  ('HW', 'KH', 'HAWKER',  'HAWKER 南洋料理',    'HAWKER Southeast Asian'),
  ('BL', 'KH', 'BLT33',   'BLT33 大廳酒吧',     'BLT33 Lobby Bar')
ON CONFLICT (id) DO NOTHING;

-- 150 tables (5 restaurants × 30 tables). Use generate_series for brevity.
INSERT INTO tables (id, restaurant_id, display_label)
SELECT
  r.id || lpad(t.n::text, 2, '0') AS id,
  r.id AS restaurant_id,
  lpad(t.n::text, 2, '0') AS display_label
FROM (VALUES ('ZL'),('WR'),('SD'),('HW'),('BL')) AS r(id),
     generate_series(1, 30) AS t(n)
ON CONFLICT (id) DO NOTHING;
