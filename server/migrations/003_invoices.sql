-- ─────────────────────────────────────────────────────────────────
-- Migration 003 (Postgres): invoice dedup
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  invoice_no           TEXT PRIMARY KEY,
  seller_vat           TEXT,
  buyer_vat            TEXT,
  amount_total         INTEGER NOT NULL,
  amount_sales         INTEGER,
  invoice_date         TEXT,
  redeemed_by_userid   TEXT NOT NULL,
  redeemed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restaurant_id        TEXT,
  table_id             TEXT,
  dice_issued          INTEGER NOT NULL,
  raw_qr               TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_time
  ON invoices(redeemed_by_userid, redeemed_at DESC);
