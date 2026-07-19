-- FloreaHub Ads Table
-- Run this in Supabase SQL Editor

create table if not exists ads (
  id text primary key,
  florist_id text not null,
  florist_name text not null,
  type text not null check (type in ('product_boost', 'shop_spotlight', 'premium_banner')),
  product_id text,
  product_name text,
  image_url text,
  headline text not null,
  tagline text,
  budget numeric not null,
  start_date timestamptz,
  end_date timestamptz,
  status text not null default 'pending' check (status in ('active', 'pending', 'expired', 'paused')),
  clicks integer not null default 0,
  impressions integer not null default 0,
  bill_code text,
  created_at timestamptz not null default now()
);

-- Anyone can read active ads (for homepage/shop display)
alter table ads enable row level security;

create policy "Public read active ads"
  on ads for select
  using (status = 'active' and end_date > now());

create policy "Public read all ads by florist"
  on ads for select
  using (true);

-- Index for fast queries
create index if not exists ads_status_type_idx on ads (status, type);
create index if not exists ads_bill_code_idx on ads (bill_code);
create index if not exists ads_florist_id_idx on ads (florist_id);
