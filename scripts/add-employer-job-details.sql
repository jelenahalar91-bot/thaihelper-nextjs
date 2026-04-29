-- Add per-job-detail columns to employer_accounts so families can specify
-- exactly what tasks they need help with, when they need it, and for how long.
--
-- All columns are CSV TEXT to mirror the convention already used by
-- helper_profiles (`category`, `skills`, `additional_cities`).

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS needed_skills     TEXT,    -- e.g. "infant_care, school_run"
  ADD COLUMN IF NOT EXISTS schedule_days     TEXT,    -- e.g. "weekdays, weekends"
  ADD COLUMN IF NOT EXISTS schedule_time     TEXT,    -- e.g. "morning, evening"
  ADD COLUMN IF NOT EXISTS duration          TEXT,    -- single value: "ongoing"
  ADD COLUMN IF NOT EXISTS child_age_groups  TEXT;    -- e.g. "toddler, school_age"
