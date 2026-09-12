-- Conversations are hidden per side, not destroyed.
--
-- Why this exists (2026-09-12): EMP-572KZV posted two 1-star reviews on
-- helpers he had never messaged, then the conversations that made him
-- eligible to post them disappeared. /api/ratings enforces "both sides
-- exchanged a message" at write time only, and DELETE /api/conversations
-- hard-deleted the conversation AND its messages while helper_ratings kept
-- the review. The accusation survived; the evidence that would have refuted
-- it did not.
--
-- The obvious fix — delete the review along with the conversation — is worse.
-- Either side can delete a conversation, so it would hand every helper a
-- one-click way to erase an honest bad review: delete the thread, the rating
-- goes with it. Trading a retaliation vector for a scrubbing vector.
--
-- So deletion becomes per-side hiding. The row and its messages stay; the
-- thread vanishes from the list of whoever deleted it. Eligibility keeps
-- resolving, moderation keeps the paper trail, and neither side can remove
-- a review by deleting the conversation behind it.
--
-- NULL = visible to that side. A timestamp = hidden since then, and a useful
-- moderation signal in its own right: a review posted minutes before the
-- rater hid the thread is worth a look.
--
-- Run in Supabase SQL editor.

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS deleted_by_helper_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by_employer_at TIMESTAMPTZ;

-- The conversation list filters on (owner, not-deleted) and orders by
-- last_message_at. Partial indexes keep those scans on the visible rows only.
CREATE INDEX IF NOT EXISTS conversations_helper_visible_idx
  ON conversations (helper_ref, last_message_at DESC)
  WHERE deleted_by_helper_at IS NULL;

CREATE INDEX IF NOT EXISTS conversations_employer_visible_idx
  ON conversations (employer_id, last_message_at DESC)
  WHERE deleted_by_employer_at IS NULL;
