-- ─────────────────────────────────────────────────────────────────
-- Migration 003: Invoice dedup
--
-- Phase 5: 客戶掃發票左 QR 自助拿擲骰機會,取代多數情境的 staff activate。
-- (Tony 2026-05-14: option a — 只做掃發票自助,載具/統編走 staff)
--
-- 防作弊策略:
--   1. invoice_no UNIQUE — 同張發票全世界終身只能 redeem 一次
--   2. 必須在 60 分鐘內有 active table_bindings — 確認客戶人在 IC 現場
--      (Tony 2026-05-14: 不需驗統編,靠桌邊立牌物理位置 + binding 時效)
--   3. 金額 / 2000 (上限 5) — 跟 staff activate 一致
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  invoice_no           TEXT PRIMARY KEY,   -- AB12345678 (2 alpha + 8 digits)
  seller_vat           TEXT,               -- 從 QR 解出,純 audit 不驗
  buyer_vat            TEXT,               -- 大多空字串
  amount_total         INTEGER NOT NULL,   -- 從 QR 解出 total_amt_hex
  amount_sales         INTEGER,            -- 銷售額(不含稅)
  invoice_date         TEXT,               -- yyyymmdd from QR
  redeemed_by_userid   TEXT NOT NULL,
  redeemed_at          TEXT NOT NULL DEFAULT (datetime('now')),
  restaurant_id        TEXT,               -- 推測:從 user 最近 active binding
  table_id             TEXT,               -- 同上
  dice_issued          INTEGER NOT NULL,
  raw_qr               TEXT                -- 原始 QR string,debug 用
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_time
  ON invoices(redeemed_by_userid, redeemed_at DESC);
