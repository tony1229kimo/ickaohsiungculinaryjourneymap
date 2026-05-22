-- Tony 2026-05-23: prevent "infinite coupon claims" via LINE Flex button.
--
-- Problem: OmniChat's coupon bind URLs are stateless — clicking the same
-- URL twice triggers two coupon deliveries. Each Flex card we push to a
-- customer's LINE chat has a "領取優惠券" button pointing directly at the
-- OmniChat URL, so a customer who keeps tapping the same Flex card gets
-- unlimited coupons.
--
-- Fix: wrap each push with a unique single-use token. The Flex button URL
-- becomes our /api/claim/{token} which atomically marks the token used and
-- 302-redirects to the OmniChat URL ONCE. Subsequent clicks redirect to a
-- "you already claimed" page.

CREATE TABLE IF NOT EXISTS claim_tokens (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  reward_id   TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  coupon_link TEXT NOT NULL,
  -- source distinguishes push origin for analytics: lottery / fixed_tile /
  -- compensation. Free-text so future additions don't need migrations.
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claim_tokens_user ON claim_tokens(user_id, created_at DESC);
