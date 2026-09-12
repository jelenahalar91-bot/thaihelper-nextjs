-- Tracks the "your job post has no description" reminder.
--
-- Families could tick categories (nanny, tutor, pet sitter) and leave the
-- free-text description empty, so helpers saw a post with no hours, no
-- children's ages, no dog sizes — nothing to judge the job by. The
-- description is a required field now (see lib/constants/employer.js
-- JOB_DESCRIPTION_MIN_LENGTH), and every already-live profile that is
-- missing it gets one reminder email.
--
-- This column stores when that reminder went out so
-- scripts/send-job-description-reminders.js never mails the same family
-- twice (pass --force to override, e.g. for a second round weeks later).

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS job_description_reminder_sent_at TIMESTAMPTZ;
