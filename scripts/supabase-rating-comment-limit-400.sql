-- Update rating comment limit from 280 to 400 characters
-- Run in Supabase SQL editor

-- Drop the old CHECK constraint and create a new one with the higher limit
ALTER TABLE helper_ratings
  DROP CONSTRAINT IF EXISTS helper_ratings_comment_check;

ALTER TABLE helper_ratings
  ADD CONSTRAINT helper_ratings_comment_check
  CHECK (comment IS NULL OR char_length(comment) <= 400);

-- Update the comment in the source schema file for future reference
-- (This SQL file is the source of truth for new deployments)
