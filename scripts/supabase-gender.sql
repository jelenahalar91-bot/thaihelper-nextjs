-- Helper gender — the one filter families asked for and the only
-- hard requirement we never collected.
--
-- Two values, no "prefer not to say": the whole point of the column is the
-- browse filter, and an opt-out value would put whoever picks it outside
-- every gender filter a family uses — i.e. invisible to exactly the families
-- searching for them. Nationality can afford that opt-out because nobody
-- filters a nanny search by it; this cannot.
--
-- NULL stays legal and means "not answered yet". The 1074 helpers who
-- registered before this column existed all start there: the browse filter
-- treats NULL as "no match" for a specific gender, and /profile asks for it
-- on the next login. See scripts/backfill-helper-gender.js for the
-- Thai-particle backfill that seeds the unambiguous cases.
ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IN ('female', 'male'));

-- The browse list filters on it, so it is read on every /helpers load and
-- every mobile app start. Partial: NULL rows are never the target of a
-- gender filter, so they don't belong in the index.
CREATE INDEX IF NOT EXISTS idx_helper_profiles_gender
  ON helper_profiles (gender)
  WHERE gender IS NOT NULL;
