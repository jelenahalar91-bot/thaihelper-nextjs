-- LINE account linking columns for helpers and employers.
--
-- Stores the user's LINE userId (provided by LINE webhook events) plus a
-- short-lived link token used during the friend-add → "send link XXX"
-- handshake. Once line_user_id is populated, the reminder cron / message
-- pipeline can push notifications to that user via the LINE Messaging API.
--
-- Run this once in the Supabase SQL editor.

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS line_user_id      TEXT,
  ADD COLUMN IF NOT EXISTS line_link_token   TEXT,
  ADD COLUMN IF NOT EXISTS line_link_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS line_linked_at    TIMESTAMPTZ;

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS line_user_id      TEXT,
  ADD COLUMN IF NOT EXISTS line_link_token   TEXT,
  ADD COLUMN IF NOT EXISTS line_link_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS line_linked_at    TIMESTAMPTZ;

-- Lookup index — webhook pulls user by line_user_id on every push.
CREATE INDEX IF NOT EXISTS idx_helper_profiles_line_user_id
  ON helper_profiles(line_user_id) WHERE line_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employer_accounts_line_user_id
  ON employer_accounts(line_user_id) WHERE line_user_id IS NOT NULL;

-- Lookup index — webhook resolves a "link XXX" message to a user via token.
CREATE INDEX IF NOT EXISTS idx_helper_profiles_line_link_token
  ON helper_profiles(line_link_token) WHERE line_link_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employer_accounts_line_link_token
  ON employer_accounts(line_link_token) WHERE line_link_token IS NOT NULL;
