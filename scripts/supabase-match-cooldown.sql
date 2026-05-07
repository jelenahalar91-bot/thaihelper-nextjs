-- Match-notification cooldown column for helpers and employers.
--
-- Tracks the last time a recipient was notified about a match (immediate
-- send OR digest). Used by lib/match-notifications.js to enforce a 3-day
-- cooldown so users don't get spammed when many opposite-side users
-- register or update their profiles in a short window. Matches that fall
-- within the cooldown window are picked up later by the digest cron at
-- /api/cron/match-digest.
--
-- Run this once in the Supabase SQL editor.

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS last_match_notification_at TIMESTAMPTZ;

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS last_match_notification_at TIMESTAMPTZ;

-- Digest cron pulls users where the timestamp is NULL or older than the
-- cooldown window. A partial index keeps the scan small as the table grows.
CREATE INDEX IF NOT EXISTS idx_helper_profiles_match_cooldown
  ON helper_profiles(last_match_notification_at NULLS FIRST)
  WHERE email_verified = true;

CREATE INDEX IF NOT EXISTS idx_employer_accounts_match_cooldown
  ON employer_accounts(last_match_notification_at NULLS FIRST)
  WHERE email_verified = true;
