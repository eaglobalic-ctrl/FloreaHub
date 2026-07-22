-- Delivery tracking (Lalamove/Grab/etc) as a second, faster way to advance
-- an order's status — saving a tracking number auto-bumps status to
-- "delivering", alongside the existing manual status buttons (both stay
-- available; this doesn't replace the manual flow).
alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists courier text;
