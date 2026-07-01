-- English translation of the employer job description, mirroring
-- helper_profiles.bio_en / area_en. Populated on signup and profile
-- update via Google Translate (Thai/foreign → English) and rendered on
-- the English UI so English-reading helpers can read Thai job posts.
-- NULL means "no translation needed" (the description is already English),
-- in which case the UI falls back to the original job_description.
ALTER TABLE employer_accounts ADD COLUMN IF NOT EXISTS job_description_en TEXT;
