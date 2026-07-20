-- Proper buyer+seller architecture (Shopee/Grab style)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ujzejgqnrjiwafjicgxh/sql
--
-- Context: seller-application status used to live on `users.status`, which
-- also gates login — so an existing buyer applying to become a seller would
-- get locked out of their own buyer account while waiting for approval.
-- Application status now lives on `florists` instead, where it belongs.
-- `users.status` stops being a login gate; everyone can always log in once
-- registered, and one account can hold both a buyer identity and a
-- (separately reviewed) florist storefront.

ALTER TABLE florists
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- Existing florists (seed demo shops + anything already approved) stay approved.
