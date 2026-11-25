-- Helpers may register with a phone number instead of an email address.
--
-- WHY. The reference number that logs a helper in is delivered to her email,
-- so an address she cannot open is an account she cannot reach. The standard
-- reply this page's Messenger sends a Burmese helper still begins "open
-- gmail.com and tap Create account" — we were asking a domestic worker to
-- open a Google account before she could look for work. Of the families who
-- wrote to a helper last seen more than ninety days ago, 0 of 229 ever got an
-- answer (measured 2026-11-25).
--
-- The number is the better credential anyway: Twilio Verify proves the
-- handset, lib/phone-identity.js enforces one number per account, and an SMS
-- costs an attacker money. Email proves none of that.
--
-- SAFE ON EXISTING ROWS. Every helper_profiles row today has an address, so
-- dropping NOT NULL changes nothing for them and the CHECK validates without
-- a rewrite. Postgres allows unlimited NULLs under a UNIQUE index, so the
-- duplicate-email guard in pages/api/register.js keeps working for the rows
-- that do have one.
--
-- Run in the Supabase SQL editor.

ALTER TABLE helper_profiles ALTER COLUMN email DROP NOT NULL;

-- An account with neither channel could never be contacted, logged into, or
-- recovered. The database is the only place this can be guaranteed: the API
-- is not the only thing that writes here (admin scripts do too).
ALTER TABLE helper_profiles
  DROP CONSTRAINT IF EXISTS helper_profiles_contact_present;

ALTER TABLE helper_profiles
  ADD CONSTRAINT helper_profiles_contact_present
  CHECK (
    (email IS NOT NULL AND btrim(email) <> '')
    OR (phone_number IS NOT NULL AND btrim(phone_number) <> '')
  );

COMMENT ON COLUMN helper_profiles.email IS
  'Optional since 2026-11-25. NULL means she registered with a phone number; '
  'helper_profiles_contact_present guarantees one of the two is set. Anything '
  'that sends mail must check for NULL first.';
