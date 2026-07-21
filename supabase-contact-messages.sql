-- Contact form (/contact) was 100% fake — handleSubmit just faked a
-- "sent" state after a setTimeout, nothing was ever saved or emailed.
-- This adds the real backing table.

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx on contact_messages(created_at desc);

alter table contact_messages enable row level security;

-- No public policies — only ever touched via the service-role key
-- (same model as orders/reminders).
