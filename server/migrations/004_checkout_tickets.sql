-- Phase 8: Checkout QR tickets — staff-issued amount-bearing one-time tokens.
--
-- Flow:
--   Staff in /admin/checkout enters amount → POST /api/checkout-ticket/issue
--   Backend mints a short random token, stores (token, amount, expires_at)
--   Frontend renders QR pointing to https://<game>/?ticket=<token>
--   Customer scans with LINE camera, lands in LIFF, POST /api/checkout-ticket/redeem
--   Backend atomically marks the row used + creates dice_pool entry
--
-- TTL is short (2 min) so a leaked screenshot is useless after the table leaves.
-- We don't tie a ticket to a specific user at issue time — any LIFF-authed user
-- who scans first wins. The 2-min window + physical handoff is the security.

CREATE TABLE IF NOT EXISTS checkout_tickets (
  token              TEXT PRIMARY KEY,
  amount             INTEGER NOT NULL CHECK (amount > 0),
  dice_to_issue      INTEGER NOT NULL CHECK (dice_to_issue > 0),
  issued_by          TEXT NOT NULL,        -- 'numeric_password' or staff_user_id
  restaurant_id      TEXT,                 -- optional, set by issuer
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at         TIMESTAMPTZ NOT NULL,
  used_at            TIMESTAMPTZ,
  used_by_user_id    TEXT
);

CREATE INDEX IF NOT EXISTS idx_checkout_tickets_expires ON checkout_tickets (expires_at) WHERE used_at IS NULL;
