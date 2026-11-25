-- Separate "we looked at you" from "we wrote to you".
--
-- The weekly match digest picked its candidates by last_match_notification_at
-- and stamped that column only when a digest actually went out. Everyone the
-- run examined and found nothing for — no new family in her city, profile
-- paused, notifications switched off — stayed unstamped and came back at the
-- head of the very next run's 200-row window. Each extra Monday run therefore
-- advanced the frontier only by the number of people the run before it had
-- written to, instead of by a full window.
--
-- Measured on Monday 2026-11-23, the first Monday after the weekly switch:
-- the four runs stamped 218, then 146, then 96, then 48. A decaying series,
-- not four full windows. 374 of 1115 eligible helpers were reached; 374 more
-- had a genuinely matching new family and were never looked at.
--
-- last_match_scan_at is the cursor: set for every candidate a run resolves,
-- whether or not it had anything to say. last_match_notification_at keeps its
-- old meaning — the last time we actually wrote — and stays the cutoff for
-- "new since you last heard from us", so a scan that found nothing does not
-- shorten the window of the next digest that finds something.
--
-- Deliberately NOT backfilled. Leaving it NULL makes the first Monday after
-- this change a complete sweep of the base, which is the point.

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS last_match_scan_at TIMESTAMPTZ;

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS last_match_scan_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_helper_profiles_match_scan
  ON helper_profiles(last_match_scan_at NULLS FIRST);

CREATE INDEX IF NOT EXISTS idx_employer_accounts_match_scan
  ON employer_accounts(last_match_scan_at NULLS FIRST);
