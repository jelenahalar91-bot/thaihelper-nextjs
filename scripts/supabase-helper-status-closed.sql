-- Allow 'closed' on helper_profiles.status.
--
-- scripts/supabase-account-status.sql (2026-09-09) declared the three-state
-- vocabulary for BOTH sides of the platform:
--
--   'active'     — normal
--   'suspended'  — staff stopped the account (spam, scam, abuse)
--   'closed'     — not advertised any more, but still the user's account
--
-- On employer_accounts it landed, because that column was new. On
-- helper_profiles it silently did nothing: `status` already existed from the
-- original table with a CHECK of ('pending', 'active', 'suspended'), so
-- ADD COLUMN IF NOT EXISTS skipped the column AND its intended constraint.
-- The result was a vocabulary the code believes in and the database rejects —
-- lib/access.js has listed 'closed' in UNLISTED_STATUSES since 2026-10, and
-- every helper query already excludes it, but no helper row could ever hold
-- it. Found on 2026-10-26 while closing a duplicate profile.
--
-- 'pending' is kept. Nothing writes it today and no row holds it, but
-- dropping a value from a CHECK is a separate decision from adding one, and
-- making this migration able to fail on live data would defeat its purpose.
--
-- Why 'closed' and not 'suspended' for a duplicate: a second profile is not
-- abuse. 'suspended' blocks login (pages/api/auth.js) and blocks replies in
-- existing conversations (pages/api/conversations.js); 'closed' does neither.
-- It takes the listing out of /helpers, the homepage panels, favourites,
-- match digests and reminder mails, and leaves the person their login, their
-- dashboard and their existing threads.

ALTER TABLE helper_profiles
  DROP CONSTRAINT IF EXISTS helper_profiles_status_check;

ALTER TABLE helper_profiles
  ADD CONSTRAINT helper_profiles_status_check
    CHECK (status IN ('pending', 'active', 'suspended', 'closed'));
