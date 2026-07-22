-- FASA 4.3: subscription renewal reminders + auto-downgrade need somewhere
-- to record "already reminded" so the cron doesn't resend every run.

alter table subscriptions add column if not exists renewal_reminder_sent_at timestamptz;
