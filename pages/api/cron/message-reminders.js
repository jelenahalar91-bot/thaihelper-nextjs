// GET /api/cron/message-reminders
//
// Daily cron (01:00 UTC, configured in vercel.json) that nudges people about
// messages they never opened.
//
// Reminders belong to the waiting CONVERSATION, not to each message, and there
// are exactly two of them:
//
//   message arrives  → "new message" email (pages/api/messages.js)
//   + 48h unopened   → reminder 1
//   + 72h unopened   → reminder 2, the last one
//
// After that the thread goes quiet however long it stays unread, and a message
// the same sender adds on day two joins that run instead of starting its own —
// someone who already knows they have mail waiting doesn't need a fresh copy
// of the news. Opening the thread flips is_read and resets everything, so the
// next round of messages gets the full sequence again.
//
// Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
// when CRON_SECRET is set in env vars. If the secret isn't configured we
// fall back to allowing requests from `x-vercel-cron: 1` (Vercel adds this
// header for its own cron) so the job still runs in dev/preview.

import { getServiceSupabase } from '../../../lib/supabase';
import { sendMessageReminderEmail } from '../../../lib/send-confirmation-email';
import { createUnsubscribeToken, buildUnsubscribeUrl } from '../../../lib/unsubscribe';

// Don't reach back too far on the very first run after we ship this — there
// could be hundreds of old unread messages from the broken-messaging period
// and we don't want to suddenly blast everyone. Cap to messages from the
// last 7 days.
const MAX_REMINDER_AGE_HOURS = 24 * 7;
// Hours the oldest unread message must have been sitting there before each
// reminder. Index = reminders already sent for that thread.
const REMINDER_AGE_HOURS = [48, 72];
const MAX_REMINDERS_PER_THREAD = REMINDER_AGE_HOURS.length;
const MIN_REMINDER_AGE_HOURS = REMINDER_AGE_HOURS[0];
// Keep one cron run bounded so we don't time out on a backlog.
const MAX_REMINDERS_PER_RUN = 50;

function authorize(req) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.authorization || '';
    return got === `Bearer ${expected}`;
  }
  // The x-vercel-cron header isn't a real auth signal — any client can
  // send it. In production we must have CRON_SECRET set or the cron
  // endpoints become a public mass-email trigger.
  if (process.env.NODE_ENV === 'production') {
    console.error('CRON_SECRET not set in production — refusing cron run');
    return false;
  }
  return req.headers['x-vercel-cron'] === '1';
}

export default async function handler(req, res) {
  if (!authorize(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(200).json({ skipped: 'RESEND_API_KEY not set' });
  }

  const supabase = getServiceSupabase();
  const now = Date.now();
  const olderThan = new Date(now - MIN_REMINDER_AGE_HOURS * 3600 * 1000).toISOString();
  const newerThan = new Date(now - MAX_REMINDER_AGE_HOURS * 3600 * 1000).toISOString();

  // Pull a batch of candidates: unread, no reminder yet, in our window.
  const { data: candidates, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_type, sender_ref, content_original, created_at, reminder_count')
    .eq('is_read', false)
    .lt('reminder_count', MAX_REMINDERS_PER_THREAD)
    .lt('created_at', olderThan)
    .gt('created_at', newerThan)
    .order('created_at', { ascending: true })
    .limit(MAX_REMINDERS_PER_RUN);

  if (error) {
    console.error('Reminder cron query error:', error);
    return res.status(500).json({ error: 'Query failed' });
  }
  if (!candidates || candidates.length === 0) {
    return res.status(200).json({ ok: true, processed: 0 });
  }

  // Cache conversation + recipient lookups so we don't re-query for messages
  // that share a conversation in the same batch.
  const convCache = new Map();
  const empCache = new Map();
  const helperCache = new Map();

  let sent = 0;
  let skipped = 0;
  let bundled = 0;
  let notYetDue = 0;
  let capped = 0;
  let failed = 0;
  // conversation + sender pairs already reminded in this run.
  const remindedThreads = new Set();

  for (const msg of candidates) {
    const threadKey = `${msg.conversation_id}:${msg.sender_type}`;
    if (remindedThreads.has(threadKey)) {
      // Same sender, same thread — already covered by the reminder above.
      bundled++;
      continue;
    }
    try {
      // 0. The thread's anchor: the oldest unread message from this sender.
      //    Its reminder_count is how far the thread has got through the
      //    schedule, and its age is what the schedule is measured against —
      //    a message that arrived later doesn't restart the clock or earn a
      //    mail of its own.
      const { data: anchor } = await supabase
        .from('messages')
        .select('id, content_original, created_at, reminder_count')
        .eq('conversation_id', msg.conversation_id)
        .eq('sender_type', msg.sender_type)
        .eq('is_read', false)
        // Same 7-day window as the candidate query: a thread someone
        // abandoned months ago shouldn't anchor today's reminder, and its
        // text shouldn't be the preview in the email.
        .gt('created_at', newerThan)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      const waiting = anchor || msg;
      const stage = waiting.reminder_count || 0;

      if (stage >= MAX_REMINDERS_PER_THREAD) {
        // Both reminders are spent — this thread is done being emailed about.
        // Pull the later messages up to the same count so they stop coming
        // back as candidates every night.
        capped++;
        remindedThreads.add(threadKey);
        await markThreadReminded(supabase, msg, MAX_REMINDERS_PER_THREAD);
        continue;
      }

      const ageHours = (now - new Date(waiting.created_at).getTime()) / 3600000;
      if (ageHours < REMINDER_AGE_HOURS[stage]) {
        // Reminder 1 has gone out and reminder 2 isn't due yet. Leave the
        // whole thread alone — a later run will pick it up.
        notYetDue++;
        remindedThreads.add(threadKey);
        continue;
      }

      // 1. Conversation
      let conv = convCache.get(msg.conversation_id);
      if (!conv) {
        const { data } = await supabase
          .from('conversations')
          .select('id, helper_ref, employer_id')
          .eq('id', msg.conversation_id)
          .maybeSingle();
        if (!data) { skipped++; remindedThreads.add(threadKey); await markThreadReminded(supabase, msg, MAX_REMINDERS_PER_THREAD); continue; }
        conv = data;
        convCache.set(msg.conversation_id, conv);
      }

      // 2. Recipient (the OTHER party from the sender)
      let recipientEmail = null;
      let recipientName = null;
      let recipientRole = null;
      let recipientRef = null;
      let notifyOptedIn = true;

      if (msg.sender_type === 'helper') {
        // Recipient is the employer
        const cached = empCache.get(conv.employer_id);
        let emp = cached;
        if (!emp) {
          const { data } = await supabase
            .from('employer_accounts')
            .select('first_name, email, notify_on_message, employer_ref')
            .eq('employer_ref', conv.employer_id)
            .maybeSingle();
          emp = data || null;
          empCache.set(conv.employer_id, emp);
        }
        if (emp) {
          recipientEmail = emp.email;
          recipientName = emp.first_name;
          recipientRole = 'employer';
          recipientRef = emp.employer_ref;
          notifyOptedIn = emp.notify_on_message !== false;
        }
      } else {
        // Recipient is the helper
        const cached = helperCache.get(conv.helper_ref);
        let hlp = cached;
        if (!hlp) {
          const { data } = await supabase
            .from('helper_profiles')
            .select('first_name, email, notify_on_message, helper_ref, availability_status')
            .eq('helper_ref', conv.helper_ref)
            .maybeSingle();
          hlp = data || null;
          helperCache.set(conv.helper_ref, hlp);
        }
        if (hlp) {
          recipientEmail = hlp.email;
          recipientName = hlp.first_name;
          recipientRole = 'helper';
          recipientRef = hlp.helper_ref;
          // A hidden profile means "stop contacting me" — no reminders.
          notifyOptedIn = hlp.notify_on_message !== false
            && hlp.availability_status !== 'hidden';
        }
      }

      // 3. Sender name (for the email body)
      let senderName = 'Someone';
      if (msg.sender_type === 'employer') {
        const cached = empCache.get(msg.sender_ref);
        let emp = cached;
        if (!emp) {
          const { data } = await supabase
            .from('employer_accounts')
            .select('first_name')
            .eq('employer_ref', msg.sender_ref)
            .maybeSingle();
          emp = data || null;
          empCache.set(msg.sender_ref, emp);
        }
        if (emp?.first_name) senderName = emp.first_name;
      } else {
        const cached = helperCache.get(msg.sender_ref);
        let hlp = cached;
        if (!hlp) {
          const { data } = await supabase
            .from('helper_profiles')
            .select('first_name')
            .eq('helper_ref', msg.sender_ref)
            .maybeSingle();
          hlp = data || null;
          helperCache.set(msg.sender_ref, hlp);
        }
        if (hlp?.first_name) senderName = hlp.first_name;
      }

      // 4. Send (or skip if opted out / missing email) — either way, mark
      //    as reminded so we don't keep re-evaluating it every hour.
      if (recipientEmail && notifyOptedIn && recipientRef) {
        const token = await createUnsubscribeToken(recipientRole, recipientRef);
        const unsubscribeUrl = buildUnsubscribeUrl(token);
        await sendMessageReminderEmail({
          recipientName,
          recipientEmail,
          senderName,
          senderRole: msg.sender_type,
          recipientRole,
          messagePreview: waiting.content_original,
          unsubscribeUrl,
        });
        sent++;
      } else {
        skipped++;
      }
      remindedThreads.add(threadKey);
      await markThreadReminded(supabase, msg, stage + 1);
    } catch (err) {
      console.error('Reminder send failed for message', msg.id, err.message);
      failed++;
      // Don't mark on failure — let the next cron run try again.
    }
  }

  return res.status(200).json({
    ok: true,
    processed: candidates.length,
    sent,
    skipped,
    bundled,
    notYetDue,
    capped,
    failed,
  });
}

// Move the whole unread run from this sender in this conversation to `count`,
// not just the one message that tripped the query. Messages that arrived
// after it are part of the same "you have something waiting" — reminding
// about each separately is exactly what we're trying to stop. Reading the
// thread clears is_read, so the sender's next message starts a fresh run at
// count 0 and gets the full sequence again.
async function markThreadReminded(supabase, msg, count) {
  await supabase
    .from('messages')
    .update({ reminder_sent_at: new Date().toISOString(), reminder_count: count })
    .eq('conversation_id', msg.conversation_id)
    .eq('sender_type', msg.sender_type)
    .eq('is_read', false)
    .lt('reminder_count', count);
}
