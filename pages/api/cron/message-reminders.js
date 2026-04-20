// GET /api/cron/message-reminders
//
// Hourly cron (configured in vercel.json) that sends a single reminder email
// for any message that has been unread for 24+ hours. Each message is
// reminded at most once — `reminder_sent_at` is set after the first reminder.
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
const MIN_REMINDER_AGE_HOURS = 24;
// Keep one cron run bounded so we don't time out on a backlog.
const MAX_REMINDERS_PER_RUN = 50;

function authorize(req) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.authorization || '';
    return got === `Bearer ${expected}`;
  }
  // No secret configured — accept Vercel's own cron header.
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
    .select('id, conversation_id, sender_type, sender_ref, content_original, created_at')
    .eq('is_read', false)
    .is('reminder_sent_at', null)
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
  let failed = 0;

  for (const msg of candidates) {
    try {
      // 1. Conversation
      let conv = convCache.get(msg.conversation_id);
      if (!conv) {
        const { data } = await supabase
          .from('conversations')
          .select('id, helper_ref, employer_id')
          .eq('id', msg.conversation_id)
          .maybeSingle();
        if (!data) { skipped++; await markReminderSent(supabase, msg.id); continue; }
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
            .select('first_name, email, notify_on_message, helper_ref')
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
          notifyOptedIn = hlp.notify_on_message !== false;
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
          messagePreview: msg.content_original,
          unsubscribeUrl,
        });
        sent++;
      } else {
        skipped++;
      }
      await markReminderSent(supabase, msg.id);
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
    failed,
  });
}

async function markReminderSent(supabase, messageId) {
  await supabase
    .from('messages')
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq('id', messageId);
}
