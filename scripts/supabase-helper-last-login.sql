-- Add last_login_at to helper_profiles so the public browse cards can
-- show "Last active Xd ago" — families want to know which helpers are
-- still around, not just who registered most recently. Mirrors the
-- employer_accounts.last_login_at column that already exists.
--
-- Updated by /api/auth.js (on every successful login) and by
-- /api/profile.js (on every profile PUT — explicit activity signal).
--
-- Run in Supabase SQL editor.

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Backfill: existing helpers haven't logged in since this column was
-- introduced. updated_at is a better proxy than created_at because
-- it reflects the most recent meaningful change to the profile
-- (photo, bio, availability toggle, etc.), not just signup.
UPDATE helper_profiles
  SET last_login_at = COALESCE(updated_at, created_at)
  WHERE last_login_at IS NULL;
