-- Tracks the "your job post has no description" reminder.
--
-- A job description per selected category has been required at registration
-- since 2026-10-02 (missingJobTexts in lib/employer-job-details.js), and it
-- works: of the family accounts opened since, 3 are empty, and all three
-- registered on the deploy day itself. What the rule never reached is the
-- profiles that predate it — 63 live posts showing ticked categories and no
-- text at all.
--
-- scripts/send-job-description-reminders.js mails those families once. This
-- column stores when that went out, so nobody is asked twice (--force sends
-- again, e.g. for a second round weeks later).

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS job_description_reminder_sent_at TIMESTAMPTZ;
