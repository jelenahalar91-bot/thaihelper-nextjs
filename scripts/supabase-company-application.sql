-- Richer partner applications — November 2026.
--
-- The /partners form used to ask for five things (company, contact, email,
-- phone, website) and required only two of them. After seven applications the
-- damage was visible in the table: a phone number typed into the contact-name
-- field, a LINE URL typed into the phone field, two companies outside Thailand
-- altogether — and, worst, never a `city`, which directory_listings requires
-- NOT NULL. An approved application could not become a listing without writing
-- back to the company to ask.
--
-- The form now collects a full listing draft up front and stores it as JSONB in
-- exactly the shape sanitizeListingInput() returns, so onboarding prefills from
-- it and the admin can judge an application on real detail instead of a name
-- and a Gmail address.
--
-- Run once in the Supabase SQL editor.

ALTER TABLE company_accounts
  ADD COLUMN IF NOT EXISTS listing_draft      JSONB,
  ADD COLUMN IF NOT EXISTS email_verified_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason   TEXT,
  ADD COLUMN IF NOT EXISTS info_requested_at  TIMESTAMPTZ;

COMMENT ON COLUMN company_accounts.listing_draft IS
  'Listing fields from the /partners application, in sanitizeListingInput() shape. Prefills onboarding.';
COMMENT ON COLUMN company_accounts.email_verified_at IS
  'Set when the applicant clicks the verification link. The admin is only notified after this.';
