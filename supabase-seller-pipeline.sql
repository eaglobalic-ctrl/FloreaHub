-- Seller pipeline fixes
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ujzejgqnrjiwafjicgxh/sql
--
-- Context: the florist approval system (supabase-florist-approval.sql) tracks
-- application status on `users`, but never created a matching row in
-- `florists` (the table that actually powers storefronts, products, and
-- orders). This adds the one missing column needed to carry the applicant's
-- state through to their florists row. The florists row itself is created by
-- application code (PATCH /api/users) at the moment an application is
-- approved — no SQL needed for that part.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS shop_state TEXT;
