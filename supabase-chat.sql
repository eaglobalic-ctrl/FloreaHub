-- Live chat between buyers and florists.

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references users(id) on delete cascade,
  florist_id uuid not null references florists(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  buyer_unread_count integer not null default 0,
  florist_unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (buyer_id, florist_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_role text not null check (sender_role in ('buyer', 'florist')),
  content text,
  image_url text,
  blocked_reason text,
  created_at timestamptz not null default now()
);

create index if not exists conversations_buyer_id_idx on conversations(buyer_id);
create index if not exists conversations_florist_id_idx on conversations(florist_id);
create index if not exists messages_conversation_id_idx on messages(conversation_id);

alter table conversations enable row level security;
alter table messages enable row level security;

-- No public policies — same model as orders/reminders: only touched
-- server-side via the service-role key, after the app's own session
-- check confirms the caller is the buyer or the florist on that thread.
