-- Add education_en column for English-translated free-text education
-- Same pattern as area_en / bio_en — helpers type their education
-- in any script (often Thai abbreviations like "ปวส.", "ป.ตรี") and
-- we mirror an English translation alongside for the EN viewers.
--
-- Run in Supabase SQL editor.

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS education_en TEXT;

-- Backfill is handled by scripts/backfill-education-en.js
