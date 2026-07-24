-- These 4 tables had Row Level Security disabled entirely — found during a
-- security review (2026-07-24). The app never queries any table through the
-- public anon key (confirmed: src/lib/supabase.ts's getSupabase() is
-- defined but never called anywhere — every route uses getSupabaseAdmin(),
-- the service-role client, which bypasses RLS regardless). But Supabase's
-- own security model treats the anon key as inherently public — RLS, not
-- key secrecy, is meant to be the real gate. Enabling RLS with zero
-- policies here matches the pattern already used successfully on orders,
-- users, messages, etc.: default-deny for anon/authenticated roles via
-- PostgREST, while the service role (used by every API route) is
-- unaffected since it bypasses RLS entirely.
alter table notifications enable row level security;
alter table push_subscriptions enable row level security;
alter table rate_limits enable row level security;
alter table testimonials enable row level security;
