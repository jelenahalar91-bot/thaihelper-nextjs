-- Add email_verified_at timestamp so the match-digest cron can find
-- helpers/employers who verified AFTER signup, not just those who
-- registered+verified in the same window.
--
-- Run in Supabase SQL editor.

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Backfill: assume existing email_verified=true rows verified at
-- registration time (created_at). That's a reasonable lower bound —
-- the digest will simply skip them on the next run (since they're
-- older than the cooldown), which is correct: they're not new.
UPDATE helper_profiles
  SET email_verified_at = created_at
  WHERE email_verified = true AND email_verified_at IS NULL;

UPDATE employer_accounts
  SET email_verified_at = created_at
  WHERE email_verified = true AND email_verified_at IS NULL;
