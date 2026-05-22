-- Tony 2026-05-22: real bug — checkout-ticket / room-charge redeem fails
-- whenever staff didn't pre-select a restaurant in /admin/checkout, because
-- the resulting `INSERT INTO dice_pool` violates dice_pool.restaurant_id
-- NOT NULL. The redeem catch silently masked this as `reason: not_found`
-- so the customer saw "QR Code 無效" while the ticket was actually fine.
--
-- The FK to restaurants(id) stays (NULL is allowed under a FK by default).
-- Existing rows already have a non-null value, so this is non-destructive.

ALTER TABLE dice_pool
  ALTER COLUMN restaurant_id DROP NOT NULL;
