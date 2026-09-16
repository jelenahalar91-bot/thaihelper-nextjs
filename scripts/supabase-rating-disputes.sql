-- Review disputes + hire confirmations (2026-09-16)
--
-- Two small additions that belong together, because they are the two halves
-- of making reviews visible from the very first one (see
-- lib/rating-visibility.js, which dropped MIN_PUBLIC_REVIEWS 3 → 1 on the
-- same day).
--
-- 1. helper_ratings.disputed_at / dispute_reason
--    A helper who thinks a review is false clicks the link in the email we
--    send them and says so. The review STAYS VISIBLE — hiding it on the
--    accused person's say-so would just move the abuse to the other side.
--    What the dispute buys is speed: an admin mail lands immediately, so a
--    false review can be deleted within minutes instead of whenever someone
--    happens to read a support reply.
--
-- 2. hire_confirmations
--    A helper pressing "I was hired by this family" in the chat. It emails
--    the family once, asking them to review — and it is the first hard
--    signal the platform has ever had that a job actually happened, since
--    hiring itself occurs off-platform. UNIQUE(helper_ref, employer_ref)
--    is what keeps the button from becoming a way to pester a family.
--
-- Run in the Supabase SQL editor.

ALTER TABLE helper_ratings
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_helper_ratings_disputed
  ON helper_ratings(disputed_at DESC)
  WHERE disputed_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS hire_confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  helper_ref TEXT NOT NULL,
  employer_ref TEXT NOT NULL,
  -- Who pressed the button. Today only 'helper' writes rows here; the
  -- employer's equivalent statement is the review itself.
  confirmed_by TEXT NOT NULL DEFAULT 'helper',
  -- Whether the "please review me" email to the family actually went out,
  -- so a Resend failure can be retried without letting the button fire twice.
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (helper_ref, employer_ref)
);

CREATE INDEX IF NOT EXISTS idx_hire_confirmations_employer
  ON hire_confirmations(employer_ref);

ALTER TABLE hire_confirmations ENABLE ROW LEVEL SECURITY;
