-- Multi-channel notification preferences for helpers and employers.
--
-- Lets users opt in to additional notification channels (LINE / WhatsApp) on
-- top of email. Conversations themselves still happen on the platform — the
-- helper's LINE id / phone is never exposed to employers. These columns just
-- store the preference; the actual subscription (LINE friend-add, WhatsApp
-- opt-in) happens in a separate flow that fills the corresponding
-- *_user_id / *_phone fields once that infrastructure is live.
--
-- Run this once in the Supabase SQL editor.

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS notify_via_line     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_via_whatsapp BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS notify_via_line     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_via_whatsapp BOOLEAN NOT NULL DEFAULT false;
