-- Tracks whether the florist has seen this paid order in their dashboard
-- yet — powers a "new orders" badge the same way conversations already
-- track florist_unread_count for chat.
alter table orders add column if not exists florist_seen_at timestamptz;
