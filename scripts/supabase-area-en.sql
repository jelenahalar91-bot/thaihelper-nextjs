-- Add area_en column for English-translated free-text area
-- Run in Supabase SQL editor.
--
-- Helpers can type their area / district in any script (often Thai).
-- We mirror the bio / bio_en pattern: store the original in `area` and
-- the English translation in `area_en`, populated at registration time
-- via Google Translate (see lib/translate.js translateForeignText).

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS area_en TEXT;

-- After running this, run scripts/backfill-area-en.js to translate
-- existing rows where area has non-Latin script.
