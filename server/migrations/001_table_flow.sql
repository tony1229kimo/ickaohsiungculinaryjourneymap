-- ─────────────────────────────────────────────────────────────────
-- Migration 001: Table flow (B 方案 — 桌邊 LINE 加好友 + 結帳推送)
-- See TABLE_FLOW_SPEC.md §5 for the full schema rationale.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hotels (
  id              TEXT PRIMARY KEY,
  name_zh         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  line_channel_id TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS restaurants (
  id          TEXT PRIMARY KEY,
  hotel_id    TEXT NOT NULL REFERENCES hotels(id),
  code        TEXT NOT NULL,
  name_zh     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tables (
  id              TEXT PRIMARY KEY,
  restaurant_id   TEXT NOT NULL REFERENCES restaurants(id),
  display_label   TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT 'idle',
  state_changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS table_bindings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id        TEXT NOT NULL REFERENCES tables(id),
  user_id         TEXT NOT NULL,
  bound_at        TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at      TEXT NOT NULL,
  consumed_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_bindings_table_active
  ON table_bindings(table_id, consumed_at, expires_at);

CREATE TABLE IF NOT EXISTS dice_pool (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             TEXT NOT NULL,
  restaurant_id       TEXT NOT NULL REFERENCES restaurants(id),
  dice_remaining      INTEGER NOT NULL,
  amount_spent        INTEGER NOT NULL,
  issued_at           TEXT NOT NULL DEFAULT (datetime('now')),
  issued_by_staff_id  TEXT NOT NULL,
  table_id            TEXT REFERENCES tables(id),
  exhausted_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_dice_pool_user_active
  ON dice_pool(user_id, exhausted_at);

CREATE TABLE IF NOT EXISTS staff_actions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_user_id   TEXT NOT NULL,
  staff_name      TEXT,
  action          TEXT NOT NULL,
  table_id        TEXT REFERENCES tables(id),
  payload         TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff_whitelist (
  user_id         TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,
  restaurant_id   TEXT REFERENCES restaurants(id),
  added_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────────
-- Seed: IC 高雄(實際 5 餐廳清單等 Tony 補,先用 placeholder)
-- 這段在 Tony 提供正式資料後會 UPDATE
-- ─────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO hotels (id, name_zh, name_en, line_channel_id) VALUES
  ('KH', '高雄洲際酒店', 'InterContinental Kaohsiung', NULL);

-- TODO: replace with real restaurant data from Tony
INSERT OR IGNORE INTO restaurants (id, hotel_id, code, name_zh, name_en) VALUES
  ('A', 'KH', 'TBD-A', 'TBD 餐廳 A', 'TBD Restaurant A'),
  ('B', 'KH', 'TBD-B', 'TBD 餐廳 B', 'TBD Restaurant B'),
  ('C', 'KH', 'TBD-C', 'TBD 餐廳 C', 'TBD Restaurant C'),
  ('D', 'KH', 'TBD-D', 'TBD 餐廳 D', 'TBD Restaurant D'),
  ('E', 'KH', 'TBD-E', 'TBD 餐廳 E', 'TBD Restaurant E');
