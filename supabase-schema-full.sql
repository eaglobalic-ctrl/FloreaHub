-- ============================================================
-- FloreaHub Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- USERS
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  phone text,
  role text not null default 'buyer' check (role in ('buyer', 'florist', 'admin')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- FLORISTS
create table if not exists florists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  name text not null,
  slug text unique,
  description text,
  address text,
  city text not null default 'Kuala Lumpur',
  state text not null default 'Selangor',
  phone text,
  email text,
  cover_image text,
  logo_url text,
  rating numeric(3,2) default 0,
  review_count integer default 0,
  is_verified boolean default false,
  is_active boolean default true,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'elite')),
  same_day_delivery boolean default false,
  min_order numeric default 0,
  delivery_fee numeric default 0,
  created_at timestamptz not null default now()
);

-- PRODUCTS
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  florist_id uuid references florists(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null,
  original_price numeric,
  category text not null default 'daily',
  image_url text,
  badge text,
  same_day boolean default false,
  stock integer default 0,
  rating numeric(3,2) default 0,
  review_count integer default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- ORDERS
create table if not exists orders (
  id text primary key,
  user_id uuid references users(id) on delete set null,
  florist_id uuid references florists(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'delivering', 'delivered', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  subtotal numeric not null,
  delivery_fee numeric not null default 0,
  total numeric not null,
  recipient_name text,
  recipient_phone text,
  delivery_address text,
  delivery_date date,
  notes text,
  bill_code text,
  created_at timestamptz not null default now()
);

-- ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_image text,
  florist_name text,
  price numeric not null,
  quantity integer not null default 1
);

-- REVIEWS
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  florist_id uuid references florists(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  order_id text references orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_verified boolean default false,
  created_at timestamptz not null default now()
);

-- SUBSCRIPTIONS (florist plans)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  florist_id uuid references florists(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'elite')),
  status text not null default 'pending' check (status in ('active', 'pending', 'expired', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  bill_code text,
  amount numeric not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table users enable row level security;
alter table florists enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table subscriptions enable row level security;

-- Public read policies
create policy "Public read florists" on florists for select using (is_active = true);
create policy "Public read products" on products for select using (is_active = true);
create policy "Public read reviews" on reviews for select using (true);

-- Service role has full access (used by API routes)
-- All writes go through API routes using service_role key

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists florists_city_idx on florists (city);
create index if not exists florists_plan_idx on florists (plan);
create index if not exists products_florist_idx on products (florist_id);
create index if not exists products_category_idx on products (category);
create index if not exists orders_user_idx on orders (user_id);
create index if not exists orders_florist_idx on orders (florist_id);
create index if not exists orders_status_idx on orders (status);
create index if not exists reviews_florist_idx on reviews (florist_id);
create index if not exists order_items_order_idx on order_items (order_id);

-- ============================================================
-- SEED DATA — Demo florists & products
-- ============================================================

insert into florists (id, name, slug, description, city, state, phone, email, cover_image, rating, review_count, is_verified, is_active, plan, same_day_delivery, delivery_fee) values
  ('11111111-1111-1111-1111-111111111111', 'Bloom & Co', 'bloom-and-co', 'Premium floral arrangements for every occasion. Specializing in romantic bouquets and wedding florals since 2015.', 'Kuala Lumpur', 'Wilayah Persekutuan', '+60 12-345 6789', 'hello@bloomandco.my', 'https://image.pollinations.ai/prompt/luxury+flower+shop+interior+roses+elegant?width=800&height=400&nologo=true&seed=101', 4.9, 312, true, true, 'elite', true, 15),
  ('22222222-2222-2222-2222-222222222222', 'Petal Paradise', 'petal-paradise', 'Your one-stop destination for fresh, exotic blooms. Same-day delivery available across the Klang Valley.', 'Petaling Jaya', 'Selangor', '+60 11-234 5678', 'info@petalparadise.my', 'https://image.pollinations.ai/prompt/colorful+flower+shop+tropical+blooms+bright?width=800&height=400&nologo=true&seed=202', 4.8, 187, true, true, 'pro', true, 12),
  ('33333333-3333-3333-3333-333333333333', 'Garden Dreams', 'garden-dreams', 'Nature-inspired arrangements with a modern twist. From minimalist designs to grand floral installations.', 'Subang Jaya', 'Selangor', '+60 16-789 0123', 'contact@gardendreams.my', 'https://image.pollinations.ai/prompt/modern+minimalist+flower+shop+green+white?width=800&height=400&nologo=true&seed=303', 4.7, 245, true, true, 'pro', true, 10),
  ('44444444-4444-4444-4444-444444444444', 'Fleur Luxe', 'fleur-luxe', 'Luxury bespoke floral design for weddings, corporate events, and special milestones.', 'Mont Kiara', 'Wilayah Persekutuan', '+60 17-456 7890', 'luxury@fleurluxe.my', 'https://image.pollinations.ai/prompt/luxury+white+rose+wedding+flowers+elegant?width=800&height=400&nologo=true&seed=404', 5.0, 98, true, true, 'elite', false, 20)
on conflict (id) do nothing;

insert into products (florist_id, name, description, price, original_price, category, image_url, badge, same_day, stock, rating, review_count) values
  ('11111111-1111-1111-1111-111111111111', 'Classic Red Rose Bouquet', '24 premium red roses wrapped in luxury packaging. Perfect for anniversaries and romantic gestures.', 120, 150, 'anniversary', 'https://image.pollinations.ai/prompt/classic+red+rose+bouquet+luxury+packaging?width=400&height=400&nologo=true&seed=1001', 'Bestseller', true, 20, 4.9, 89),
  ('11111111-1111-1111-1111-111111111111', 'Sunflower Happiness Box', 'Bright sunflowers in a premium gift box. Guaranteed to brighten anyone''s day.', 95, null, 'birthday', 'https://image.pollinations.ai/prompt/sunflower+happiness+gift+box+yellow+bright?width=400&height=400&nologo=true&seed=1002', 'Popular', true, 15, 4.7, 67),
  ('22222222-2222-2222-2222-222222222222', 'Wedding White Collection', 'Elegant white roses and peonies. Bespoke wedding arrangements available.', 280, 320, 'wedding', 'https://image.pollinations.ai/prompt/elegant+white+wedding+flower+arrangement+peonies?width=400&height=400&nologo=true&seed=1003', 'Premium', false, 8, 5.0, 42),
  ('22222222-2222-2222-2222-222222222222', 'Birthday Bloom Box', 'A curated mix of seasonal flowers in our signature bloom box. Great birthday surprise.', 150, null, 'birthday', 'https://image.pollinations.ai/prompt/birthday+flower+bloom+box+colorful+mixed?width=400&height=400&nologo=true&seed=1004', 'New', true, 12, 4.8, 31),
  ('33333333-3333-3333-3333-333333333333', 'Pastel Garden Bouquet', 'Soft pastel tones featuring garden roses, lisianthus and eucalyptus. Romantic and timeless.', 175, 200, 'anniversary', 'https://image.pollinations.ai/prompt/pastel+garden+bouquet+roses+eucalyptus+romantic?width=400&height=400&nologo=true&seed=1005', 'Popular', true, 10, 4.6, 58),
  ('33333333-3333-3333-3333-333333333333', 'Corporate Prestige Stand', 'Tall floral stand arrangement for corporate events, lobbies and openings.', 350, null, 'corporate', 'https://image.pollinations.ai/prompt/corporate+floral+stand+white+elegant+lobby?width=400&height=400&nologo=true&seed=1006', 'Premium', false, 5, 4.9, 23),
  ('44444444-4444-4444-4444-444444444444', 'Luxury Peony Arrangement', 'Full, lush peonies in premium vase. The ultimate luxury gift for any occasion.', 320, 380, 'anniversary', 'https://image.pollinations.ai/prompt/luxury+pink+peony+arrangement+vase+elegant?width=400&height=400&nologo=true&seed=1007', 'Luxury', false, 6, 5.0, 19),
  ('44444444-4444-4444-4444-444444444444', 'Sympathy Wreath', 'Tasteful white wreath arrangement. Respectful and dignified floral tribute.', 220, null, 'sympathy', 'https://image.pollinations.ai/prompt/white+sympathy+wreath+funeral+elegant+dignified?width=400&height=400&nologo=true&seed=1008', null, false, 8, 4.8, 14)
on conflict do nothing;
