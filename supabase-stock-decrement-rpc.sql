-- Atomic stock decrement — replaces the previous read-then-write pattern in
-- the ToyyibPay callback, which could lose updates when two orders for the
-- same product were paid for at nearly the same time (both read the same
-- stock value before either write landed). SELECT ... FOR UPDATE takes a row
-- lock before computing the new value, so concurrent callers serialize on
-- the DB instead of racing on a stale in-memory value.
--
-- Returns both old_stock and new_stock (not just new_stock) so the caller
-- can tell whether this particular decrement is what crossed the product
-- into low-stock/out-of-stock territory, without a second non-atomic read.
drop function if exists decrement_product_stock(uuid, integer);

create or replace function decrement_product_stock(p_product_id uuid, p_quantity integer)
returns table(old_stock integer, new_stock integer)
language plpgsql
as $$
declare
  v_old integer;
  v_new integer;
begin
  select coalesce(stock, 0) into v_old from products where id = p_product_id for update;
  v_new := greatest(0, v_old - p_quantity);
  update products set stock = v_new where id = p_product_id;
  return query select v_old, v_new;
end;
$$;
