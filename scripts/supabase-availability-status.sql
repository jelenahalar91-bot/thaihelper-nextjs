-- Add availability_status column for helper "I'm available / open to
-- offers / currently working" toggle.
--
-- Defaults to 'available' so existing helpers don't disappear from the
-- browse list. Helpers update this from their profile dashboard.

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS availability_status TEXT
    DEFAULT 'available'
    CHECK (availability_status IN ('available', 'open_to_offers', 'working'));

-- Backfill any existing NULLs to 'available' (in case the column was
-- added without a default at some point).
UPDATE helper_profiles
  SET availability_status = 'available'
  WHERE availability_status IS NULL;
