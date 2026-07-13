-- Employer "when do you need help to start" field (added 2026-07-13)
--
-- Lets a family tell helpers how urgent their search is — separate from
-- both `created_at` (when they registered) and `updated_at` (when they
-- last touched their profile). A family that registered a month ago
-- and is still "looking to start immediately" reads very differently
-- from one that's flexible/planning ahead.
--
--   'immediate'       — need someone right away
--   'within_2_weeks'  — need someone within 2 weeks
--   'within_1_month'  — need someone within 1 month
--   'flexible'        — no fixed timeline, planning ahead
--
-- Nullable/optional — not every family fills this in, same spirit as
-- preferred_age_range. Run once in the Supabase SQL editor.

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS start_timing TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employer_accounts_start_timing_check'
  ) THEN
    ALTER TABLE employer_accounts
      ADD CONSTRAINT employer_accounts_start_timing_check
      CHECK (start_timing IS NULL OR start_timing IN ('immediate', 'within_2_weeks', 'within_1_month', 'flexible'));
  END IF;
END $$;
