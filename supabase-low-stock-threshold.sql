-- Per-product low-stock threshold, florist-editable — a single bouquet
-- product needs a much lower alert line (e.g. 3) than a single-stem
-- product sold in bulk (e.g. 20), so one global number doesn't fit every
-- listing. Defaults to 5 to match the threshold already used everywhere
-- before this was configurable.
alter table products add column if not exists low_stock_threshold integer not null default 5;
