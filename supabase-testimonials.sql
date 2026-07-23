create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('buyer', 'florist')),
  name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists testimonials_approved_idx on testimonials(approved);

NOTIFY pgrst, 'reload schema';
