-- Product context on chat messages — Shopee-style "product card" that
-- appears in the thread when a buyer opens chat from a product page.
-- Denormalized (name/price/image snapshotted at send time) so the card
-- stays accurate in chat history even if the product later changes or
-- is deleted.

alter table messages add column if not exists product_id uuid references products(id) on delete set null;
alter table messages add column if not exists product_name text;
alter table messages add column if not exists product_price numeric;
alter table messages add column if not exists product_image text;
