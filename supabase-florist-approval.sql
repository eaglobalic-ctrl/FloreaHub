-- Florist approval system
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ujzejgqnrjiwafjicgxh/sql

-- Add status column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS shop_name TEXT,
  ADD COLUMN IF NOT EXISTS shop_city TEXT,
  ADD COLUMN IF NOT EXISTS shop_phone TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

-- Existing florist accounts set to approved
UPDATE users SET status = 'approved' WHERE role = 'florist';

-- Buyers stay 'active'
-- New florists will be inserted as 'pending' via application code
