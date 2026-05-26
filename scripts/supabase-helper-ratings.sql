-- Helper Ratings (1-5 stars + optional 280-char comment)
--
-- Families rate helpers after they've messaged with each other.
-- Eligibility (both sides exchanged at least one message) is enforced
-- at the API layer, not the DB — too many cross-table dependencies
-- to express cleanly as a CHECK/trigger.
--
-- One rating per (helper, employer) pair, UPSERTed on resubmit.
--
-- employer_first_name is snapshotted at rating time so the review
-- still displays a name if the employer later deletes their account.
-- That's standard practice for review systems (Airbnb, Etsy, etc.)
-- and ThaiHelper is not GDPR-scoped (Thailand-based, see project memory).
--
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS helper_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  helper_ref TEXT NOT NULL,
  employer_ref TEXT NOT NULL,
  employer_first_name TEXT,
  stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 280),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (helper_ref, employer_ref)
);

CREATE INDEX IF NOT EXISTS idx_helper_ratings_helper
  ON helper_ratings(helper_ref, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_helper_ratings_employer
  ON helper_ratings(employer_ref);

-- Cached aggregates on helper_profiles so /api/helpers can render
-- "★ 4.7 (12)" badges without joining + aggregating on every load.
ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- Trigger: keep aggregates in sync on every insert/update/delete.
-- We always recompute from scratch for the affected helper — slightly
-- less efficient than incremental updates, but bulletproof against
-- concurrent writes and avoids drift bugs.
CREATE OR REPLACE FUNCTION update_helper_rating_aggregate()
RETURNS TRIGGER AS $$
DECLARE
  target_ref TEXT;
BEGIN
  target_ref := COALESCE(NEW.helper_ref, OLD.helper_ref);
  UPDATE helper_profiles
  SET
    rating_avg = (
      SELECT ROUND(AVG(stars)::numeric, 2)
      FROM helper_ratings
      WHERE helper_ref = target_ref
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM helper_ratings
      WHERE helper_ref = target_ref
    )
  WHERE helper_ref = target_ref;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_helper_ratings_aggregate ON helper_ratings;
CREATE TRIGGER trg_helper_ratings_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON helper_ratings
  FOR EACH ROW EXECUTE FUNCTION update_helper_rating_aggregate();

-- RLS: enable (consistent with rest of schema; all access goes
-- through API routes with the service-role key, which bypasses RLS).
ALTER TABLE helper_ratings ENABLE ROW LEVEL SECURITY;
