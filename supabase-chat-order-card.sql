-- "Message Seller" after checkout was reusing the generic product-inquiry
-- card ("asking about this product"), which reads wrong for an order that
-- already happened. This adds a distinct order card, auto-posted into the
-- conversation the moment payment is confirmed.

alter table messages add column if not exists order_id text references orders(id) on delete set null;
