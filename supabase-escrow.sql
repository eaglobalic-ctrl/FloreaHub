-- Escrow flow (Shopee-style): payment collects 100% to the platform
-- account, buyer confirms receipt (or auto-confirms after a grace period),
-- THEN the order is flagged ready for florist payout — instead of
-- splitting money to the florist automatically at the moment of payment.

alter table orders add column if not exists delivered_at timestamptz;
alter table orders add column if not exists buyer_confirmed_at timestamptz;
alter table orders add column if not exists payout_completed_at timestamptz;
