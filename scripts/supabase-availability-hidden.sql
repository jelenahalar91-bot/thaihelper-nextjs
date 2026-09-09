-- Helper "hidden" availability status (added 2026-09-09)
--
-- Adds a fourth value to helper_profiles.availability_status so a helper who
-- found a job can take their profile offline WITHOUT deleting the account:
--
--   'available'      — looking for work; listed publicly, contactable. (default)
--   'open_to_offers' — has a job but listed with an "open to offers" badge.
--   'working'        — has a job; still listed, badged "Working".
--   'hidden'         — removed from the public browse list entirely. No new
--                      conversations, no match/digest emails, no new-message
--                      notifications. Existing chats stay readable.
--                      The helper flips it back from their dashboard.
--
-- Mirrors employer_accounts.search_status ('searching' / 'paused' / 'hidden'),
-- see scripts/supabase-employer-search-status.sql.
--
-- Run once in the Supabase SQL editor BEFORE deploying the app change —
-- otherwise the CHECK constraint rejects the new value.

-- The original constraint came in with ADD COLUMN ... CHECK (...) in
-- scripts/supabase-availability-status.sql, so Postgres named it
-- helper_profiles_availability_status_check. Drop it and re-add with the
-- fourth value. Idempotent — safe to re-run.
ALTER TABLE helper_profiles
  DROP CONSTRAINT IF EXISTS helper_profiles_availability_status_check;

ALTER TABLE helper_profiles
  ADD CONSTRAINT helper_profiles_availability_status_check
  CHECK (availability_status IN ('available', 'open_to_offers', 'working', 'hidden'));

-- Helps the public-list queries that filter hidden helpers out.
CREATE INDEX IF NOT EXISTS idx_helper_profiles_availability_status
  ON helper_profiles (availability_status);
