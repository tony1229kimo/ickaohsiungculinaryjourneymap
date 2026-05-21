-- Tony 2026-05-21: 掛房帳 (charge-to-room) variant of the checkout-QR flow.
--
-- Hotel guests who charge their meal to the room don't get a 統一發票 from
-- the restaurant — Front Office settles at checkout with room rate. So
-- restaurant staff can't enter an invoice_no. We add a `source` column to
-- distinguish:
--
--   source = 'checkout'    → existing flow, invoice_no required
--   source = 'room_charge' → no invoice, no double-redeem protection via
--                            invoices table; only TTL + token-uniqueness guards
--
-- Backfill: every existing ticket pre-dates this column → 'checkout'.

ALTER TABLE checkout_tickets
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'checkout';

-- Defensive: lock down the allowed values via CHECK.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'checkout_tickets_source_chk'
  ) THEN
    ALTER TABLE checkout_tickets
      ADD CONSTRAINT checkout_tickets_source_chk
      CHECK (source IN ('checkout', 'room_charge'));
  END IF;
END $$;
