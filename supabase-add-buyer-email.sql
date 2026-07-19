-- Add buyer contact columns to orders table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ujzejgqnrjiwafjicgxh/sql

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS buyer_name  TEXT,
  ADD COLUMN IF NOT EXISTS buyer_email TEXT;
