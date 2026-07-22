-- FASA 3 split payment: records what was actually sent to ToyyibPay's
-- billSplitPaymentArgs for this order row, so the (future) admin financial
-- dashboard can find orders that SHOULD have split but couldn't (florist_id
-- set, split_recipient still null — usually because that florist never
-- finished ToyyibPay payout setup) and flag them for manual payout.

alter table orders add column if not exists split_recipient text;
alter table orders add column if not exists split_amount numeric;
