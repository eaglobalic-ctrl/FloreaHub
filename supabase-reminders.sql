-- Occasion Reminders: was a client-only mock (useState with hardcoded
-- demo rows) with no backing table at all. This adds the real thing.

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  occasion_date date not null,
  type text not null default 'other',
  notify_days_before integer not null default 3,
  last_notified_year integer,
  created_at timestamptz not null default now()
);

create index if not exists reminders_user_id_idx on reminders(user_id);

alter table reminders enable row level security;

-- No public policies — reminders are private and only ever touched via
-- the service-role key in API routes (same model as orders/order_items).
