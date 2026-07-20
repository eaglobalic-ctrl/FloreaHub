-- Real password authentication
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ujzejgqnrjiwafjicgxh/sql
--
-- Context: registration collected a password but never sent it to the
-- backend, and login only checked that an email existed — no password was
-- ever verified. This adds the column the new auth flow hashes passwords
-- into (bcrypt, via password_hash) so login/register work like real
-- authentication instead of an email-only lookup.
--
-- Any account created before this migration has password_hash = NULL.
-- The first login attempt for such an account claims it: whatever password
-- is submitted is hashed and saved as that account's password from then on.
-- If you have an existing admin/test account, log in with it right after
-- this ships so you claim it before anyone else who knows that email can.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;
