-- Split payment (FASA 2/3) needs each florist's own ToyyibPay account
-- username so their share of a sale can be routed directly to them.

alter table florists add column if not exists toyyibpay_username text;

-- Tracks whether we've already nudged this florist about missing payout
-- setup, so the reminder cron doesn't re-notify every run.
alter table florists add column if not exists payout_reminder_sent_at timestamptz;
