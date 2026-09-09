-- Account moderation status for employers and helpers.
--
-- Until now a suspension had to be improvised out of four unrelated columns
-- (search_status / email_verified / email / notify_on_message — see
-- scripts/suspend-employer.js). That works, but it destroys the account's real
-- email address and cannot express WHY an account was stopped.
--
-- 'active'     — normal
-- 'suspended'  — staff stopped the account (spam, scam, abuse)
-- 'closed'     — the user deleted their own account
--
-- Defaults to 'active' so every existing row keeps working untouched.

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS status TEXT
    DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'closed')),
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS status TEXT
    DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'closed')),
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

UPDATE employer_accounts SET status = 'active' WHERE status IS NULL;
UPDATE helper_profiles   SET status = 'active' WHERE status IS NULL;

-- Listings and moderation sweeps both filter on this.
CREATE INDEX IF NOT EXISTS employer_accounts_status_idx ON employer_accounts (status);
CREATE INDEX IF NOT EXISTS helper_profiles_status_idx   ON helper_profiles   (status);

-- Record the one account already suspended by hand on 2026-09-09, so the
-- new column agrees with reality from the start. Its email/verified/search
-- fields stay as they are until the code reads `status` instead.
UPDATE employer_accounts
  SET status = 'suspended',
      status_reason = 'Mass off-platform solicitation: contact handoffs pushed into 111 conversations. Reported by TH-1PVSSB.',
      status_changed_at = '2026-09-09T00:00:00Z'
  WHERE employer_ref = 'EMP-B4MUCP';
