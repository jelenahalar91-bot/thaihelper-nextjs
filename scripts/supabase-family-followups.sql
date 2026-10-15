-- Family follow-ups (2026-10-14)
--
-- Two emails a family can get after signing up, and the columns that keep
-- each of them to its schedule. Both run from the daily cron
-- (pages/api/cron/message-reminders.js → lib/family-followups.js) and both
-- are off until FAMILY_FOLLOWUPS_LIVE=true is set, so the first live run is
-- a decision, not an accident.
--
-- 1. Agency suggestions
--    At signup a family may tick "if I don't find someone here, you may
--    suggest agencies from your directory". Two to three weeks later, if
--    they are still searching and have not told us they hired anyone, they
--    get ONE email with the agencies that serve their city and publish
--    their fees. The family goes to the agency; the agency never gets the
--    family's details. agency_referral_sent_at makes it one email, ever.
--
-- 2. "Still looking?"
--    182 families were "searching" on 2026-10-14; 131 of them had signed up
--    more than four weeks earlier and only 23 of those had logged in during
--    the last two weeks. The status is simply never updated. Once a month a
--    family that has gone quiet gets one email with four one-click answers
--    (still looking / found someone here / found someone elsewhere / not
--    looking) — each a signed link, no login. The answer updates
--    search_status and lands in hiring_outcomes with trigger 'email'.
--    status_checkin_count stops it after three unanswered rounds.
--
-- Run once in the Supabase SQL editor. All statements are idempotent.

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS agency_referral_opt_in     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agency_referral_opt_in_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agency_referral_sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_checkin_sent_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_checkin_count       SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_checkin_answered_at TIMESTAMPTZ;

-- The cron's candidate queries filter on these; without the indexes they
-- scan the whole table every night, which is fine today and not in a year.
CREATE INDEX IF NOT EXISTS idx_employer_accounts_agency_referral
  ON employer_accounts (agency_referral_opt_in, agency_referral_sent_at)
  WHERE agency_referral_opt_in = true AND agency_referral_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employer_accounts_status_checkin
  ON employer_accounts (search_status, status_checkin_sent_at)
  WHERE search_status = 'searching';

-- The check-in email's "yes, still looking" answer. A confirmed status rather
-- than an outcome, but it belongs in the same log: it is the only way we
-- learn that an old "searching" account is a real search and not a ghost.
ALTER TABLE hiring_outcomes
  DROP CONSTRAINT IF EXISTS hiring_outcomes_outcome_check;
ALTER TABLE hiring_outcomes
  ADD CONSTRAINT hiring_outcomes_outcome_check
  CHECK (outcome IN (
    'hired_here', 'hired_elsewhere', 'not_a_match', 'still_talking',
    'stopped_looking', 'still_searching'
  ));
