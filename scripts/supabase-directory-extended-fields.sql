-- Add HelperPlace-equivalent fields to directory_listings.
-- Run once in the Supabase SQL editor. All columns use IF NOT EXISTS so it is safe to re-run.

ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS logo_url            TEXT;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS whatsapp             TEXT;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS line_id              TEXT;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS license_number       TEXT;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS opening_hours        TEXT;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS nationalities_placed TEXT; -- CSV: "thai,filipino,indonesian,myanmar"
