-- Atomic stock decrement — replaces the previous read-then-write pattern in
-- the ToyyibPay callback, which could lose updates when two orders for the
-- same product were paid for at nearly the same time (both read the same
-- stock value before either write landed). Doing "stock = stock - qty"
-- directly in the UPDATE means Postgres's own row lock serializes concurrent
-- callers instead of the app racing on a stale in-memory value.
create or replace function decrement_product_stock(p_product_id uuid, p_quantity integer)
returns integer
language plpgsql
as $$
declare
  new_stock integer;
begin
  update products
  set stock = greatest(0, coalesce(stock, 0) - p_quantity)
  where id = p_product_id
  returning stock into new_stock;

  return new_stock;
end;
$$;
