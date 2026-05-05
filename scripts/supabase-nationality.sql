-- ThaiHelper — Nationality field on helper_profiles
-- Run this in Supabase SQL Editor (idempotent; safe to re-run).
--
-- Why: with a nationality field we can answer the WP question
-- deterministically (Thai → no WP needed; everyone else → WP needed)
-- instead of relying on the optional work_permit_status field.
-- The wizard's "Hire a Thai helper" CTA also gains an exact filter.
--
-- Allowed values are intentionally finite — see lib/constants/nationalities.js
-- for the source of truth that the API + UI validate against.

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS nationality TEXT
  CHECK (nationality IN (
    'thai',
    'myanmar',
    'philippines',
    'lao',
    'cambodia',
    'vietnamese',
    'indian',
    'nepali',
    'other_asian',
    'other',
    'prefer_not_say'
  ));

CREATE INDEX IF NOT EXISTS idx_helpers_nationality
  ON helper_profiles(nationality)
  WHERE nationality IS NOT NULL;

-- One-time backfill: helpers we previously marked as work_permit_status
-- 'thai_national' (via scripts/backfill-thai-national.js) should also
-- carry nationality = 'thai' so the new wizard CTA (?nationality=thai)
-- matches them. Idempotent — only updates rows where nationality is
-- still null.
UPDATE helper_profiles
   SET nationality = 'thai'
 WHERE work_permit_status = 'thai_national'
   AND nationality IS NULL;
