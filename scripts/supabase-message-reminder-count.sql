-- Reminder cadence for unread messages (2026-09-15)
--
-- Before: one reminder per unread MESSAGE, 24h after it arrived. Someone who
-- wrote three times got you three reminder emails on top of three "new
-- message" emails.
--
-- After: reminders belong to the waiting CONVERSATION, and there are only two
-- of them — 48h and 72h after the oldest unread message from that sender.
-- reminder_count tracks which of the two has gone out (0 → none, 1 → the 48h
-- one, 2 → both, stop). Every unread message from that sender in that thread
-- carries the same count, so a message that arrives the next day joins the
-- run instead of starting its own.
ALTER TABLE IF EXISTS messages
  ADD COLUMN IF NOT EXISTS reminder_count SMALLINT NOT NULL DEFAULT 0;

-- Anything already reminded under the old rule is CLOSED, not half-way into
-- the new cadence: counting it as 1 would have sent a "72h" reminder to 99
-- old unread messages on the first cron run after this shipped.
UPDATE messages SET reminder_count = 2
  WHERE reminder_sent_at IS NOT NULL AND reminder_count < 2;

-- The cron scans unread messages that haven't used up both reminders.
DROP INDEX IF EXISTS idx_messages_reminder_pending;
CREATE INDEX IF NOT EXISTS idx_messages_reminder_pending
  ON messages(created_at)
  WHERE is_read = false AND reminder_count < 2;
