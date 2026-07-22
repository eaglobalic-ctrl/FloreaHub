-- Lightweight in-app error log so critical failures (order insert
-- rejected, etc.) are visible from the Admin Panel instead of requiring
-- Vercel dashboard log navigation.
create table if not exists system_errors (
  id uuid primary key default gen_random_uuid(),
  context text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_errors_created_at_idx on system_errors(created_at desc);

alter table system_errors enable row level security;
