-- Tony 2026-05-23: compensation tickets reuse the existing checkout_tickets
-- table but carry a reward_id instead of an amount.
--
-- Flow:
--   Staff at /admin/checkout (📨 補發 mode) picks a reward → POST
--   /api/checkout-ticket/issue-compensation → INSERT row with
--   source='compensation', reward_id set, amount/dice NULL.
--   Customer scans the QR like any other ticket. Redeem path sees
--   source='compensation' and grants the reward (push LINE + add to
--   game_state.earned_rewards) without touching dice_pool.
--
-- Why reuse the table: customer scan flow is identical regardless of which
-- type — the QR URL is /?ticket=<token>, the LIFF redeem endpoint is the
-- same, the 2-min TTL is the same, the "used_at" semantic is the same.
-- Splitting would force duplicate code paths for no gain.

-- 1) Allow amount + dice_to_issue to be NULL for compensation rows
ALTER TABLE checkout_tickets ALTER COLUMN amount        DROP NOT NULL;
ALTER TABLE checkout_tickets ALTER COLUMN dice_to_issue DROP NOT NULL;

-- 2) Drop the >0 CHECKs (auto-named *_check) — compensation has neither value
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'checkout_tickets_amount_check') THEN
    ALTER TABLE checkout_tickets DROP CONSTRAINT checkout_tickets_amount_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'checkout_tickets_dice_to_issue_check') THEN
    ALTER TABLE checkout_tickets DROP CONSTRAINT checkout_tickets_dice_to_issue_check;
  END IF;
END $$;

-- 3) Add the compensation-specific columns
ALTER TABLE checkout_tickets ADD COLUMN IF NOT EXISTS reward_id TEXT;
ALTER TABLE checkout_tickets ADD COLUMN IF NOT EXISTS comp_note TEXT;

-- 4) Extend the source enum CHECK to include 'compensation'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'checkout_tickets_source_chk') THEN
    ALTER TABLE checkout_tickets DROP CONSTRAINT checkout_tickets_source_chk;
  END IF;
  ALTER TABLE checkout_tickets
    ADD CONSTRAINT checkout_tickets_source_chk
    CHECK (source IN ('checkout', 'room_charge', 'compensation'));
END $$;
