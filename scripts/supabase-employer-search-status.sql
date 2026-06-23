-- Employer search status (added 2026-06-23)
--
-- Mirrors the helper-side availability_status. Lets an employer who has
-- found someone stop appearing to / emailing helpers without deleting
-- their account.
--
--   'searching' — actively hiring; listed publicly, contactable, gets
--                 new-helper match emails + weekly digest. (default)
--   'paused'    — not hiring right now; still listed but badged, and
--                 NO new match emails. Existing chats keep working.
--   'hidden'    — offline; removed from the public browse list entirely
--                 and no emails.
--
-- Run once in the Supabase SQL editor. Existing rows backfill to
-- 'searching' via the NOT NULL DEFAULT.

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS search_status TEXT NOT NULL DEFAULT 'searching';

-- Constrain to the three known values. Done as a separate, name-guarded
-- step so re-running the script doesn't error on an existing constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employer_accounts_search_status_check'
  ) THEN
    ALTER TABLE employer_accounts
      ADD CONSTRAINT employer_accounts_search_status_check
      CHECK (search_status IN ('searching', 'paused', 'hidden'));
  END IF;
END $$;

-- Helps the public-list query that filters out hidden employers.
CREATE INDEX IF NOT EXISTS idx_employer_accounts_search_status
  ON employer_accounts (search_status);
