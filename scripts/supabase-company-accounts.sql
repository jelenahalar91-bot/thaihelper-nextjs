-- Company accounts — the 3rd role on the marketplace (after helpers + employers).
--
-- Unlike helpers/employers (passwordless, email + ref), companies are
-- INVITE-GATED and PASSWORD-based:
--   1. Company applies via /partners            → row created, status 'requested'
--   2. Admin clicks "Approve" in the email      → status 'invited', invite link sent
--   3. Company opens invite link, sets password → status 'active', password_hash set
--   4. Company logs in (email + password) and edits its own directory listing
--
-- A company owns exactly one directory_listings row (owner_account_id below).
--
-- Run this once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS company_accounts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_ref   TEXT UNIQUE NOT NULL,           -- public ref, e.g. "BIZ-aB3xY9"
  email         TEXT UNIQUE NOT NULL,
  company_name  TEXT NOT NULL,
  contact_name  TEXT,
  phone         TEXT,
  type          TEXT,                            -- mirrors directory taxonomy (agency, lawyer, …)

  -- NULL until the company completes onboarding via the invite link.
  password_hash TEXT,

  -- requested → admin must approve
  -- invited   → approved, invite link sent, awaiting onboarding
  -- active    → onboarded, can log in
  -- rejected  → admin declined
  status        TEXT NOT NULL DEFAULT 'requested'
                CHECK (status IN ('requested', 'invited', 'active', 'rejected')),

  email_verified BOOLEAN DEFAULT false,
  approved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_accounts_email  ON company_accounts(email);
CREATE INDEX IF NOT EXISTS idx_company_accounts_ref    ON company_accounts(company_ref);
CREATE INDEX IF NOT EXISTS idx_company_accounts_status ON company_accounts(status);

-- Deny-by-default: only the service-role key (API routes) touches this table,
-- exactly like helper_profiles / employer_accounts.
ALTER TABLE company_accounts ENABLE ROW LEVEL SECURITY;

-- Link a directory listing to the company account that manages it.
-- NULL = admin-managed legacy listing (e.g. Ayasan, created by hand).
ALTER TABLE directory_listings
  ADD COLUMN IF NOT EXISTS owner_account_id UUID REFERENCES company_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_directory_owner ON directory_listings(owner_account_id);
