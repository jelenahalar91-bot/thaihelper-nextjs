-- Add `additional_cities` column to helper_profiles.
--
-- A helper has one primary `city` (kept for SEO/canonical /hire/<city>
-- pages) plus up to 5 additional locations where they can also work.
-- Stored as a comma-separated list of city slugs (same convention as
-- `category`), e.g. "ao_nang, koh_yao_yai, koh_phi_phi".

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS additional_cities TEXT;
