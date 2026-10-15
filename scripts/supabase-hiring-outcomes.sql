-- Hiring outcomes (2026-10-14)
--
-- What happened after people talked. Until now the schema knew only two
-- things about the end of a search: a helper pressed "I work for them"
-- (hire_confirmations, 24 rows in a month), or a family left a review
-- (helper_ratings, 4 rows in six months). Everything else — 125 of 149
-- serious multi-day conversations, 46 of 50 families who paused or hid
-- their profile — ended in silence. We could not say what share of
-- families find someone here, and that is the one number every later
-- conversation (with agencies, with paying families) will be about.
--
-- This table records an answer to "what happened?", asked at the two
-- moments people naturally tell us:
--
--   1. when a family or helper switches their profile to paused / hidden /
--      working (trigger 'status_change'), and
--   2. in the strip under a conversation that has become a real exchange
--      (trigger 'conversation_prompt').
--
-- One row per answer; people may answer more than once over time (a family
-- says "still talking" today and "hired" next week), so there is no UNIQUE
-- constraint. Reports are self-declared and unverifiable, exactly like
-- hire_confirmations — they are a survey, not a ledger.
--
-- Outcomes:
--   hired_here       found someone on ThaiHelper (counterparty ref set when known)
--   hired_elsewhere  found someone outside — `source` says where
--   not_a_match      this particular conversation did not lead anywhere
--   still_talking    asked too early; ask again later
--   stopped_looking  no longer looking, nobody hired
--   still_searching  (email check-in only) yes, still looking — asked again later
--
-- Sources (only with hired_elsewhere): agency | facebook | friends | other.
-- source_detail is free text, e.g. the agency's name — the competitive
-- intelligence the agency directory will be built on.
--
-- Run once in the Supabase SQL editor. Service role only (RLS, no policies),
-- the same posture as hire_confirmations.

CREATE TABLE IF NOT EXISTS hiring_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by TEXT NOT NULL CHECK (reported_by IN ('employer', 'helper')),
  -- Both refs are nullable: a helper who found a job elsewhere has no
  -- family to point at, and vice versa. For not_a_match / still_talking
  -- the API requires the counterparty; hired_here may stand without one
  -- ("found someone here, but not one of these").
  employer_ref TEXT,
  helper_ref TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN (
    'hired_here', 'hired_elsewhere', 'not_a_match', 'still_talking', 'stopped_looking',
    -- Added 2026-10-15 with the email check-in (scripts/supabase-family-followups.sql):
    -- "yes, still looking" is a confirmed status, not an outcome, but it
    -- belongs in the same log — it is how we learn the search is real.
    'still_searching'
  )),
  source TEXT CHECK (source IS NULL OR source IN ('agency', 'facebook', 'friends', 'other')),
  source_detail TEXT CHECK (source_detail IS NULL OR char_length(source_detail) <= 120),
  trigger TEXT NOT NULL CHECK (trigger IN ('status_change', 'conversation_prompt', 'email')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hiring_outcomes_employer
  ON hiring_outcomes(employer_ref, created_at DESC) WHERE employer_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hiring_outcomes_helper
  ON hiring_outcomes(helper_ref, created_at DESC) WHERE helper_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hiring_outcomes_outcome
  ON hiring_outcomes(outcome, created_at DESC);

ALTER TABLE hiring_outcomes ENABLE ROW LEVEL SECURITY;

-- Keep lint quiet and the write path safe: nothing but the service role
-- touches this table.
REVOKE ALL ON hiring_outcomes FROM anon, authenticated;

-- hire_confirmations gains a second author. Until today only helpers wrote
-- rows there; a family saying "yes, she works for us" is at least as strong
-- a signal and now lands in the same place, so the hire rate is one query:
--   select count(distinct (helper_ref, employer_ref)) from hire_confirmations;
-- The UNIQUE(helper_ref, employer_ref) stays — whoever says it first wins,
-- and the other side's statement is still kept in hiring_outcomes.
ALTER TABLE hire_confirmations
  DROP CONSTRAINT IF EXISTS hire_confirmations_confirmed_by_check;
ALTER TABLE hire_confirmations
  ADD CONSTRAINT hire_confirmations_confirmed_by_check
  CHECK (confirmed_by IN ('helper', 'employer'));
