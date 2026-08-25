-- Per-category job descriptions for employer accounts.
--
-- Families often need more than one kind of help at once (e.g. a babysitter
-- AND a housekeeper), but the profile only had a single free-text
-- job_description — so multi-category profiles read like one vague job.
-- job_details stores one description per selected category:
--
--   { "nanny":       { "text": "...", "text_en": "..." },
--     "housekeeper": { "text": "...", "text_en": "..." } }
--
-- Keys are category slugs from lib/constants/categories.js. text_en is the
-- Google-Translate English version (absent when the text is already English).
--
-- The legacy job_description / job_description_en columns are kept and
-- rewritten as a flattened "Label: text" version on every save, so every
-- consumer that only knows the old column keeps working.

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS job_details JSONB;
