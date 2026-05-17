-- Phase 8.3 (Tony 2026-05-17): bind checkout_tickets to an invoice_no
-- so the same invoice can't be (a) issued twice via /admin/checkout,
-- or (b) issued via /admin/checkout AND then redeemed self-service.
--
-- Backward-compatible: column is nullable on existing rows.

ALTER TABLE checkout_tickets
  ADD COLUMN IF NOT EXISTS invoice_no TEXT;

-- Speed up the "is this invoice already pending in an unused ticket?" lookup
CREATE INDEX IF NOT EXISTS idx_checkout_tickets_invoice
  ON checkout_tickets (invoice_no)
  WHERE used_at IS NULL AND invoice_no IS NOT NULL;
