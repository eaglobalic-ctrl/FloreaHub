-- Real forgot-password / reset-password support
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ujzejgqnrjiwafjicgxh/sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;
