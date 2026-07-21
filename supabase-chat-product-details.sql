-- More Shopee-like detail on the chat product card: original price
-- (for strikethrough discount display) and rating.

alter table messages add column if not exists product_original_price numeric;
alter table messages add column if not exists product_rating numeric;
