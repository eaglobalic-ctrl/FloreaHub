-- Run this in Supabase SQL Editor to fix INSERT/UPDATE permissions
-- The service_role key (used by API routes) bypasses RLS automatically,
-- but we add these policies as a safeguard.

-- Allow service role full access (bypasses RLS by default, this is a safety net)
-- Users: allow insert from API
create policy "Service role manage users" on users
  for all using (true) with check (true);

-- Orders: allow insert and read
create policy "Service role manage orders" on orders
  for all using (true) with check (true);

-- Order items: allow insert and read
create policy "Service role manage order_items" on order_items
  for all using (true) with check (true);

-- Ads: full access
create policy "Service role manage ads" on ad_campaigns
  for all using (true) with check (true);

-- Reviews: allow insert
create policy "Allow review insert" on reviews
  for insert with check (true);

-- Subscriptions: allow insert/update
create policy "Service role manage subscriptions" on subscriptions
  for all using (true) with check (true);
