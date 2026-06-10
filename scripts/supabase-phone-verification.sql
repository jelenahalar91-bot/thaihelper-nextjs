-- Phone verification via SMS-OTP (and optionally LINE) for both
-- helper_profiles and employer_accounts. Trust-tier 2 — sits on top
-- of email verification.
--
-- Visible effect for users: a "📞 Phone verified" badge on profiles
-- once `phone_verified_at` is set. The number itself is NEVER shown
-- publicly — only the helper / employer sees it in their own settings.
--
-- Run in Supabase SQL editor.

-- ─── helper_profiles ──────────────────────────────────────────────

ALTER TABLE helper_profiles
  -- E.164-style number without separators ("66891234567"). The
  -- country code is stored separately for display. Plaintext + RLS
  -- (per existing schema) — encryption at app layer is overkill for
  -- v1 and Thai PDPA does not class phone numbers as sensitive data.
  ADD COLUMN IF NOT EXISTS phone_number TEXT,

  -- E.164 country code ("+66"). Stored separately so a number-update
  -- can preserve the previous country choice.
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT,

  -- Set when the OTP has been successfully verified. NULL = unverified.
  -- Cleared if the user changes their number (re-verification needed).
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,

  -- Channel that last verified the number — 'sms' or 'line'.
  -- Helps us audit which channel users prefer and is shown on the
  -- helper's own settings page ("Verified via SMS on 8 Jun 2026").
  ADD COLUMN IF NOT EXISTS phone_verified_channel TEXT,

  -- Salted hash of the current OTP. We store a hash (not the code)
  -- so a DB leak doesn't expose active codes. Cleared on success.
  ADD COLUMN IF NOT EXISTS phone_otp_hash TEXT,

  -- OTP is valid for 10 minutes from send time.
  ADD COLUMN IF NOT EXISTS phone_otp_expires_at TIMESTAMPTZ,

  -- Brute-force counter. Resets on success or when a new code is sent.
  -- After 5 wrong attempts the OTP is invalidated and the user must
  -- request a new one.
  ADD COLUMN IF NOT EXISTS phone_otp_attempts SMALLINT DEFAULT 0,

  -- SMS-send rate-limit window. Counts how many SMS were sent in the
  -- current hour-window; resets when phone_sms_window_start is older
  -- than 1 hour. Prevents SMS-pumping abuse.
  ADD COLUMN IF NOT EXISTS phone_sms_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_sms_window_start TIMESTAMPTZ;

-- ─── employer_accounts ────────────────────────────────────────────

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_verified_channel TEXT,
  ADD COLUMN IF NOT EXISTS phone_otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS phone_otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_otp_attempts SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_sms_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_sms_window_start TIMESTAMPTZ;

-- ─── indexes ──────────────────────────────────────────────────────

-- We look up by number when checking "is this phone already used by
-- another account?" — partial index because most rows will be NULL.
CREATE INDEX IF NOT EXISTS helper_profiles_phone_number_idx
  ON helper_profiles (phone_number)
  WHERE phone_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS employer_accounts_phone_number_idx
  ON employer_accounts (phone_number)
  WHERE phone_number IS NOT NULL;

-- The "find verified helpers" queries (browse, hire-page) check
-- phone_verified_at. Partial index keeps it small.
CREATE INDEX IF NOT EXISTS helper_profiles_phone_verified_idx
  ON helper_profiles (phone_verified_at)
  WHERE phone_verified_at IS NOT NULL;
