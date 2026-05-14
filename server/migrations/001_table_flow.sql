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
-- Seed: IC 高雄 + 5 間餐廳(2026-05-14 確認)
-- 桌號每間先預設 30 桌(01-30),Tony 之後告知實際數量再改
-- LINE channel ID 為 IC 高雄官方帳號 1656533531
-- ─────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO hotels (id, name_zh, name_en, line_channel_id) VALUES
  ('KH', '高雄洲際酒店', 'InterContinental Kaohsiung', '1656533531');

-- Clean up any leftover TBD placeholders from earlier migration revisions
-- where the seed had A/B/C/D/E. Idempotent on fresh DBs.
DELETE FROM tables       WHERE restaurant_id IN ('A','B','C','D','E');
DELETE FROM restaurants  WHERE id IN ('A','B','C','D','E') AND code LIKE 'TBD-%';

INSERT OR IGNORE INTO restaurants (id, hotel_id, code, name_zh, name_en) VALUES
  ('ZL', 'KH', 'ZHAN-LU', '湛露中餐廳',         'Zhan Lu Chinese'),
  ('WR', 'KH', 'WA-RA',   'WA-RA 日式餐廳',     'WA-RA Japanese'),
  ('SD', 'KH', 'SEEDS',   'SEEDS 大地全日餐廳', 'SEEDS All-Day Dining'),
  ('HW', 'KH', 'HAWKER',  'HAWKER 南洋料理',    'HAWKER Southeast Asian'),
  ('BL', 'KH', 'BLT33',   'BLT33 大廳酒吧',     'BLT33 Lobby Bar');

-- 5 餐廳 × 30 桌 = 150 桌 placeholder。實際桌數由 Tony / 各餐廳經理確認後
-- 用 admin UI 或 SQL UPDATE 增刪。display_label 預設 '桌號 01'..'桌號 30'。
-- table id 規則:<restaurant_id><兩位編號>,例如 ZL05、WR12、HW28。

-- 動態生成 150 筆 INSERT 的最簡寫法(SQLite 沒 generate_series,逐筆列)
INSERT OR IGNORE INTO tables (id, restaurant_id, display_label) VALUES
  ('ZL01','ZL','01'),('ZL02','ZL','02'),('ZL03','ZL','03'),('ZL04','ZL','04'),('ZL05','ZL','05'),
  ('ZL06','ZL','06'),('ZL07','ZL','07'),('ZL08','ZL','08'),('ZL09','ZL','09'),('ZL10','ZL','10'),
  ('ZL11','ZL','11'),('ZL12','ZL','12'),('ZL13','ZL','13'),('ZL14','ZL','14'),('ZL15','ZL','15'),
  ('ZL16','ZL','16'),('ZL17','ZL','17'),('ZL18','ZL','18'),('ZL19','ZL','19'),('ZL20','ZL','20'),
  ('ZL21','ZL','21'),('ZL22','ZL','22'),('ZL23','ZL','23'),('ZL24','ZL','24'),('ZL25','ZL','25'),
  ('ZL26','ZL','26'),('ZL27','ZL','27'),('ZL28','ZL','28'),('ZL29','ZL','29'),('ZL30','ZL','30'),

  ('WR01','WR','01'),('WR02','WR','02'),('WR03','WR','03'),('WR04','WR','04'),('WR05','WR','05'),
  ('WR06','WR','06'),('WR07','WR','07'),('WR08','WR','08'),('WR09','WR','09'),('WR10','WR','10'),
  ('WR11','WR','11'),('WR12','WR','12'),('WR13','WR','13'),('WR14','WR','14'),('WR15','WR','15'),
  ('WR16','WR','16'),('WR17','WR','17'),('WR18','WR','18'),('WR19','WR','19'),('WR20','WR','20'),
  ('WR21','WR','21'),('WR22','WR','22'),('WR23','WR','23'),('WR24','WR','24'),('WR25','WR','25'),
  ('WR26','WR','26'),('WR27','WR','27'),('WR28','WR','28'),('WR29','WR','29'),('WR30','WR','30'),

  ('SD01','SD','01'),('SD02','SD','02'),('SD03','SD','03'),('SD04','SD','04'),('SD05','SD','05'),
  ('SD06','SD','06'),('SD07','SD','07'),('SD08','SD','08'),('SD09','SD','09'),('SD10','SD','10'),
  ('SD11','SD','11'),('SD12','SD','12'),('SD13','SD','13'),('SD14','SD','14'),('SD15','SD','15'),
  ('SD16','SD','16'),('SD17','SD','17'),('SD18','SD','18'),('SD19','SD','19'),('SD20','SD','20'),
  ('SD21','SD','21'),('SD22','SD','22'),('SD23','SD','23'),('SD24','SD','24'),('SD25','SD','25'),
  ('SD26','SD','26'),('SD27','SD','27'),('SD28','SD','28'),('SD29','SD','29'),('SD30','SD','30'),

  ('HW01','HW','01'),('HW02','HW','02'),('HW03','HW','03'),('HW04','HW','04'),('HW05','HW','05'),
  ('HW06','HW','06'),('HW07','HW','07'),('HW08','HW','08'),('HW09','HW','09'),('HW10','HW','10'),
  ('HW11','HW','11'),('HW12','HW','12'),('HW13','HW','13'),('HW14','HW','14'),('HW15','HW','15'),
  ('HW16','HW','16'),('HW17','HW','17'),('HW18','HW','18'),('HW19','HW','19'),('HW20','HW','20'),
  ('HW21','HW','21'),('HW22','HW','22'),('HW23','HW','23'),('HW24','HW','24'),('HW25','HW','25'),
  ('HW26','HW','26'),('HW27','HW','27'),('HW28','HW','28'),('HW29','HW','29'),('HW30','HW','30'),

  ('BL01','BL','01'),('BL02','BL','02'),('BL03','BL','03'),('BL04','BL','04'),('BL05','BL','05'),
  ('BL06','BL','06'),('BL07','BL','07'),('BL08','BL','08'),('BL09','BL','09'),('BL10','BL','10'),
  ('BL11','BL','11'),('BL12','BL','12'),('BL13','BL','13'),('BL14','BL','14'),('BL15','BL','15'),
  ('BL16','BL','16'),('BL17','BL','17'),('BL18','BL','18'),('BL19','BL','19'),('BL20','BL','20'),
  ('BL21','BL','21'),('BL22','BL','22'),('BL23','BL','23'),('BL24','BL','24'),('BL25','BL','25'),
  ('BL26','BL','26'),('BL27','BL','27'),('BL28','BL','28'),('BL29','BL','29'),('BL30','BL','30');
