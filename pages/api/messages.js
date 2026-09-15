// GET  /api/messages?conversation_id=X — Get messages for a conversation
// POST /api/messages                     — Send a message (with auto-translation)
// PUT  /api/messages                     — Mark messages as read
//
// Dual-role endpoint: works for both helpers (via th_session cookie) and
// employers (via th_emp_session cookie). Messaging is gated by the paywall
// for employers:
//   - Free tier: can GET messages but only sees a preview (first 3 words).
//                Cannot POST — returns 402 payment_required.
//   - Paid/promo tier: full access to both GET and POST.
// Helpers ALWAYS have full access (they're producing the value).

import { getAnySession, getSession, getEmployerSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { translateText, detectLanguage } from '../../lib/translate';
import {
  hasActiveAccess,
  accessDenialReason,
  maskMessageForEmployer,
  getAccessStatus,
} from '../../lib/access';
import { sendNewMessageNotification } from '../../lib/send-confirmation-email';
import { createUnsubscribeToken, buildUnsubscribeUrl } from '../../lib/unsubscribe';
import { sendPushToUser } from '../../lib/web-push';
import { checkRateLimit } from '../../lib/rate-limit';
import {
  contactSpread,
  CONTACT_SPREAD_ALERT,
  CONTACT_SPREAD_BLOCK,
  CONTACT_SPREAD_WINDOW_DAYS,
  notifyAdminOfSpamSignal,
} from '../../lib/spam-signals';
import { blockedHandlesIn, linkHandles } from '../../lib/contact-blocklist';
// Contact info in messages is still NOT blocked on content — sharing a phone
// number or LINE ID is the point of a direct-connection platform (server-side
// block removed 2026-06-08 with the repositioning).
//
// That decision came with a guardrail which no longer exists: the paywall was
// what stopped a stranger from messaging everyone, and it was removed on
// 2026-06-09 (access is now just email_verified, see lib/access.js). Free,
// unlimited, unfiltered messaging is how EMP-B4MUCP pushed a LINE handoff into
// 111 conversations before a helper reported it on 2026-09-08.
//
// lib/messaging-filter.js is therefore used again — but as a spam SIGNAL, not
// as a content gate: see lib/spam-signals.js. Ordinary contact sharing passes
// untouched; the same handoff repeated across dozens of conversations does not.

// Tell the admin inbox that someone is spraying contact details across many
// conversations. Same destination as /api/report-content — moderation is
// manual and mail-driven for now.
async function notifyAdminOfContactSpread({ senderRef, senderType, spread, blocked, sample }) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'ThaiHelper <noreply@thaihelper.app>',
    to: process.env.ADMIN_EMAIL,
    subject: `\u{1F6A8} Contact spam: ${senderType} ${senderRef} (${spread} conversations)`,
    text: [
      `${senderRef} (${senderType}) has shared contact details in ${spread} distinct`,
      `conversations in the last ${CONTACT_SPREAD_WINDOW_DAYS} days.`,
      '',
      blocked
        ? `This message was BLOCKED (limit ${CONTACT_SPREAD_BLOCK}).`
        : `Sending still allowed — alert threshold is ${CONTACT_SPREAD_ALERT}, block is ${CONTACT_SPREAD_BLOCK}.`,
      '',
      'Latest message:',
      sample,
      '',
      'Legitimate broadcast recruiters do reach the alert threshold. Check the',
      'account before acting: node scripts/suspend-employer.js ' + senderRef + ' --dry-run',
    ].join('\n'),
  });
}

const MESSAGES_PER_PAGE = 50;
// Max characters per message. Generous enough for long Thai replies but
// prevents abuse (dumping huge blobs into the DB, bloating translation cost).
const MAX_MESSAGE_LENGTH = 4000;

// Look up the current employer's live access state from the database.
// We never trust the JWT for access state — it's 30 days old.
async function loadEmployer(supabase, employerRef) {
  const { data } = await supabase
    .from('employer_accounts')
    // email_verified is the new access gate (since paywall removal on
    // 2026-06-09 — see lib/access.js). Without selecting it here the
    // hasActiveAccess check sees undefined and locks every message.
    .select('employer_ref, preferred_language, access_until, access_tier, email_verified, status, created_at, phone_verified_at')
    .eq('employer_ref', employerRef)
    .single();
  return data || null;
}

async function loadHelperRef(supabase, helperRef) {
  const { data } = await supabase
    .from('user_preferences')
    .select('helper_ref, preferred_language')
    .eq('helper_ref', helperRef)
    .single();
  return data || { helper_ref: helperRef, preferred_language: 'th' };
}

// Verify that the given session owns this conversation, and return
// conversation metadata for routing / translation.
async function loadConversation(supabase, conversationId, session) {
  // Validate UUID format defensively — .maybeSingle() handles malformed IDs
  // without throwing, and missing rows return data:null instead of an error.
  if (!conversationId || typeof conversationId !== 'string') return null;
  const { data, error } = await supabase
    .from('conversations')
    .select('id, helper_ref, employer_id, employer_name')
    .eq('id', conversationId)
    .maybeSingle();
  if (error || !data) return null;
  if (session.role === 'helper' && data.helper_ref !== session.ref) return null;
  if (session.role === 'employer' && data.employer_id !== session.ref) return null;
  return data;
}

export default async function handler(req, res) {
  // Same role-resolution as /api/conversations: stale helper cookies
  // were hijacking employer-side requests because getAnySession checked
  // helper first. Accept ?role=employer / ?role=helper as a hint, and
  // when no hint is given prefer employer.
  const roleHint = req.query.role;
  let session;
  if (roleHint === 'employer') {
    const emp = await getEmployerSession(req);
    session = emp ? { ...emp, role: 'employer' } : null;
  } else if (roleHint === 'helper') {
    const h = await getSession(req);
    session = h ? { ...h, role: 'helper' } : null;
  } else {
    const emp = await getEmployerSession(req);
    if (emp) {
      session = { ...emp, role: 'employer' };
    } else {
      const h = await getSession(req);
      session = h ? { ...h, role: 'helper' } : null;
    }
  }
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const isEmployer = session.role === 'employer';

  // Preload employer state (for access checks + target language)
  let employer = null;
  let employerHasAccess = true; // helpers are always "full access"
  if (isEmployer) {
    employer = await loadEmployer(supabase, session.ref);
    if (!employer) return res.status(401).json({ error: 'Not authenticated' });
    employerHasAccess = hasActiveAccess(employer);
  }

  // ─── GET messages ─────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { conversation_id, page = '1' } = req.query;
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id required' });
    }

    const conv = await loadConversation(supabase, conversation_id, session);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const offset = (parseInt(page, 10) - 1) * MESSAGES_PER_PAGE;

    const { data: messages, error } = await supabase
      .from('messages')
      .select(
        'id, conversation_id, sender_type, sender_ref, content_original, ' +
        'content_translated, source_language, target_language, is_read, created_at'
      )
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + MESSAGES_PER_PAGE - 1);

    if (error) {
      console.error('Messages fetch error:', error);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    // Mask content for free-tier employers
    const payload = (messages || []).map((m) =>
      isEmployer ? maskMessageForEmployer(m, employerHasAccess) : { ...m, is_locked: false }
    );

    return res.status(200).json({
      messages: payload,
      accessStatus: isEmployer ? getAccessStatus(employer) : null,
    });
  }

  // ─── POST — Send message ──────────────────────────────────────────────
  if (req.method === 'POST') {
    // Employers without a verified email cannot send messages.
    // (Previously this was a paywall — "you haven't paid for messaging
    // access". 2026-06-09 the paywall was removed in favour of free
    // messaging for any email-verified employer; see lib/access.js.)
    if (isEmployer && !employerHasAccess) {
      // The specific door, not a blanket 'email_not_verified' — see
      // accessDenialReason in lib/access.js.
      return res.status(403).json({
        error: accessDenialReason(employer),
        accessStatus: getAccessStatus(employer),
      });
    }

    // Sender must have a verified email before they can send messages.
    // Check the live DB state, not the JWT (which is long-lived).
    const senderTable = isEmployer ? 'employer_accounts' : 'helper_profiles';
    const senderRefCol = isEmployer ? 'employer_ref' : 'helper_ref';
    const { data: senderRow } = await supabase
      .from(senderTable)
      .select('email_verified, status')
      .eq(senderRefCol, session.ref)
      .single();
    if (senderRow?.status === 'suspended') {
      return res.status(403).json({ error: 'account_suspended' });
    }
    if (!senderRow?.email_verified) {
      return res.status(403).json({ error: 'email_not_verified' });
    }

    const { conversation_id, content } = req.body || {};
    const trimmed = typeof content === 'string' ? content.trim() : '';
    if (!conversation_id || !trimmed) {
      return res.status(400).json({ error: 'conversation_id and content required' });
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: 'message_too_long',
        max: MAX_MESSAGE_LENGTH,
      });
    }
    // Note: PII (phone numbers, emails, LINE / WhatsApp / Telegram
    // handles) is intentionally NOT blocked here. Families and helpers
    // are free to share contact info directly in chat — that matches the
    // direct-connection-platform positioning. What IS caught, below, is
    // the same handoff being pushed at dozens of different people; see
    // lib/spam-signals.js.

    const conv = await loadConversation(supabase, conversation_id, session);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    // Anti-scam: a contact handle belonging to a suspended account is refused
    // no matter who sends it. The volume signals below count per account, so a
    // scammer who re-registers starts them all at zero — the handle is the one
    // identity that survives that, and blocking it is what makes the suspension
    // actually cost something. See lib/contact-blocklist.js.
    //
    // Not always a scammer: a helper who copied the wrong link out of her LINE
    // app hits this too. She is exactly who it protects — the link still leads
    // to the scammer — so the message says what to check and accuses nobody.
    const blocked = await blockedHandlesIn(supabase, trimmed);
    if (blocked.length) {
      console.warn(`[blocklist] refused ${session.ref}: ${blocked.join(', ')}`);
      const fresh = await checkRateLimit({
        bucket: 'blocked-contact-alert',
        key: session.ref,
        max: 1,
        windowMs: 24 * 60 * 60 * 1000,
      });
      if (fresh) {
        notifyAdminOfSpamSignal({
          subject: `\u{1F6AB} Blocked contact handle: ${session.role} ${session.ref}`,
          lines: [
            `${session.ref} (${session.role}) tried to send a contact handle that`,
            'belongs to a suspended account:',
            '',
            ...blocked.map((h) => `  ${h}`),
            '',
            'The message was refused. Check whether this account is running the',
            'same scam, or is a victim who copied the wrong link.',
            '',
            `Message: ${trimmed.slice(0, 300)}`,
          ],
        }).catch((e) => console.error('Blocklist alert failed:', e.message));
      }
      return res.status(403).json({ error: 'blocked_contact' });
    }

    // A family sending a tap-to-open contact link is, on this platform, the
    // scam itself — see linkHandles() for the traffic this is measured on.
    // The volume signals below need 12 conversations before they say anything;
    // this fires on the first message, which is the only moment that helps the
    // person receiving it.
    //
    // It does NOT block. Warning a human in seconds is worth a false positive;
    // refusing a real family's message is not. Moderation stays a decision.
    //
    // One mail per account per day: a scammer sprays the same link at everyone
    // and the account — not the message — is what gets acted on.
    if (session.role === 'employer') {
      const links = linkHandles(trimmed);
      if (links.length) {
        const fresh = await checkRateLimit({
          bucket: 'employer-contact-link-alert',
          key: session.ref,
          max: 1,
          windowMs: 24 * 60 * 60 * 1000,
        });
        if (fresh) {
          const { data: acct } = await supabase
            .from('employer_accounts')
            .select('first_name, last_name, email, created_at')
            .eq('employer_ref', session.ref)
            .maybeSingle();
          const ageHours = acct
            ? Math.round((Date.now() - new Date(acct.created_at)) / 36e5)
            : null;
          notifyAdminOfSpamSignal({
            subject: `\u{1F517} Family sent a contact link: ${session.ref}`,
            lines: [
              `${acct ? `${acct.first_name} ${acct.last_name} <${acct.email}>` : session.ref}`,
              `Account ${session.ref}, registered ${ageHours !== null ? `${ageHours}h ago` : 'unknown'}.`,
              '',
              'Sent a tap-to-open contact link to a helper:',
              ...links.map((h) => `  ${h}`),
              '',
              'Message:',
              trimmed.slice(0, 300),
              '',
              'Families have no reason to send these — every one in the 30 days',
              'before 2026-09-15 came from a confirmed scam account. It could',
              'still be a real family answering "what is your LINE?", so read the',
              'conversation before acting:',
              `  node scripts/suspend-employer.js ${session.ref} --dry-run`,
            ],
          }).catch((e) => console.error('Contact-link alert failed:', e.message));
        }
      }
    }

    // Anti-spam: contact info is fine, spraying it at everyone is not.
    // Costs nothing for messages without contact info — contactSpread()
    // returns 0 without touching the DB in that case.
    const spread = await contactSpread(supabase, session.ref, trimmed, conversation_id);
    if (spread >= CONTACT_SPREAD_ALERT) {
      // Alert first, so a blocked sender still produces exactly one mail.
      const fresh = await checkRateLimit({
        bucket: 'contact-spread-alert',
        key: session.ref,
        max: 1,
        windowMs: 24 * 60 * 60 * 1000,
      });
      if (fresh && process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
        notifyAdminOfContactSpread({
          senderRef: session.ref,
          senderType: session.role,
          spread,
          blocked: spread >= CONTACT_SPREAD_BLOCK,
          sample: trimmed.slice(0, 300),
        }).catch((e) => console.error('Spam alert failed:', e.message));
      }
      if (spread >= CONTACT_SPREAD_BLOCK) {
        console.warn(`[spam] blocked ${session.ref}: contact info in ${spread} conversations`);
        return res.status(403).json({ error: 'contact_sharing_limit' });
      }
    }

    // Determine target language based on who the recipient is.
    // Helper -> Employer: translate to employer.preferred_language
    // Employer -> Helper: translate to helper.preferred_language (default 'th')
    let targetLanguage = null;
    if (session.role === 'helper') {
      // Recipient is the employer — look up their language
      const recipient = await loadEmployer(supabase, conv.employer_id);
      targetLanguage = recipient?.preferred_language || 'en';
    } else {
      // Recipient is the helper
      const recipient = await loadHelperRef(supabase, conv.helper_ref);
      targetLanguage = recipient?.preferred_language || 'th';
    }

    // Auto-translate if source != target. Track whether translation was
    // ATTEMPTED but failed so the client can show a warning — we still send
    // the original content so the message isn't lost.
    let sourceLanguage = null;
    let translatedContent = null;
    let translationFailed = false;
    try {
      sourceLanguage = await detectLanguage(trimmed);
      if (sourceLanguage && targetLanguage && sourceLanguage !== targetLanguage) {
        const result = await translateText(trimmed, targetLanguage, sourceLanguage);
        if (result && result.translatedText) {
          translatedContent = result.translatedText;
          sourceLanguage = result.detectedSourceLanguage || sourceLanguage;
        } else {
          translationFailed = true;
        }
      }
    } catch (err) {
      console.error('Translation error (non-critical):', err.message);
      translationFailed = true;
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_type: session.role,
        sender_ref: session.ref,
        content_original: trimmed,
        content_translated: translatedContent,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        is_read: false, // recipient hasn't seen it yet — flips to true via PUT when they open the conversation
      })
      .select()
      .single();

    if (error) {
      console.error('Message insert error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Bump conversation last_message_at, and un-hide the thread for both
    // sides. Deleting a conversation only hides it from the deleter
    // (lib/conversation-visibility.js); a thread carrying a message nobody
    // has read yet belongs in both inboxes, or the message lands somewhere
    // the recipient can no longer see it.
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        deleted_by_helper_at: null,
        deleted_by_employer_at: null,
      })
      .eq('id', conversation_id);

    // Notifications (email + push) run AFTER the response goes out — they
    // took 1-3s and made every send feel slow in the apps. On Vercel,
    // waitUntil keeps the function alive until they finish; in local dev the
    // promise just runs on its own.
    // We gate on the recipient's `notify_on_message` flag so opted-out users
    // don't get any more notifications, and we include a signed one-click
    // unsubscribe URL in every email + RFC 8058 List-Unsubscribe headers.
    const notifyRecipient = async () => {
    try {
      // One email per burst. If the recipient still has an unread message
      // from this same sender in this thread, they were already emailed about
      // it and haven't been back since — a second, third, fourth mail adds
      // nothing but inbox noise (two mails at 03:51 is what surfaced this).
      // The next email only goes out once they've opened the thread, which
      // flips is_read via the PUT below. Push is deliberately left per-message:
      // it's a glance, not an inbox entry.
      let alreadyEmailedThisBurst = false;
      if (process.env.RESEND_API_KEY) {
        const { count: unreadFromSender } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversation_id)
          .eq('sender_type', session.role)
          .eq('is_read', false)
          .neq('id', message.id);
        alreadyEmailedThisBurst = (unreadFromSender || 0) > 0;
      }

      if (process.env.RESEND_API_KEY && !alreadyEmailedThisBurst) {
        let recipientEmail = null;
        let recipientName = null;
        let recipientRole = null;
        let recipientRef = null;
        let notifyOptedIn = true;

        if (session.role === 'helper') {
          // Sender is helper → recipient is employer
          const { data: emp } = await supabase
            .from('employer_accounts')
            .select('first_name, email, notify_on_message, employer_ref')
            .eq('employer_ref', conv.employer_id)
            .single();
          if (emp) {
            recipientEmail = emp.email;
            recipientName = emp.first_name;
            recipientRole = 'employer';
            recipientRef = emp.employer_ref;
            // Treat NULL as opted-in (default is true); only false opts out.
            notifyOptedIn = emp.notify_on_message !== false;
          }
        } else {
          // Sender is employer → recipient is helper
          const { data: hlp } = await supabase
            .from('helper_profiles')
            .select('first_name, email, notify_on_message, helper_ref, availability_status')
            .eq('helper_ref', conv.helper_ref)
            .single();
          if (hlp) {
            recipientEmail = hlp.email;
            recipientName = hlp.first_name;
            recipientRole = 'helper';
            recipientRef = hlp.helper_ref;
            // A hidden profile is a full opt-out: no new-message emails
            // either, whatever the notify_on_message flag says.
            notifyOptedIn = hlp.notify_on_message !== false
              && hlp.availability_status !== 'hidden';
          }
        }

        if (recipientEmail && notifyOptedIn && recipientRef) {
          const token = await createUnsubscribeToken(recipientRole, recipientRef);
          const unsubscribeUrl = buildUnsubscribeUrl(token);
          await sendNewMessageNotification({
            recipientName,
            recipientEmail,
            senderName: session.firstName || 'Someone',
            senderRole: session.role,
            recipientRole,
            messagePreview: trimmed,
            unsubscribeUrl,
          });
        }
      }
    } catch (notifyErr) {
      console.error('Message notification email failed (non-critical):', notifyErr.message);
    }

    // Send web push notification to recipient's subscribed devices
    // (non-blocking — same reasoning as email above).
    // We reuse the same opt-out: if the recipient has notify_on_message=false
    // they don't want ANY new-message notification (email OR push).
    try {
      let recipientRole = null;
      let recipientRef = null;
      let recipientLang = 'en';
      let notifyOptedIn = true;

      if (session.role === 'helper') {
        const { data: emp } = await supabase
          .from('employer_accounts')
          .select('employer_ref, notify_on_message, preferred_language')
          .eq('employer_ref', conv.employer_id)
          .single();
        if (emp) {
          recipientRole = 'employer';
          recipientRef = emp.employer_ref;
          recipientLang = emp.preferred_language || 'en';
          notifyOptedIn = emp.notify_on_message !== false;
        }
      } else {
        // Helper preferred_language lives in user_preferences, not helper_profiles
        const { data: hlp } = await supabase
          .from('helper_profiles')
          .select('helper_ref, notify_on_message, availability_status')
          .eq('helper_ref', conv.helper_ref)
          .single();
        if (hlp) {
          recipientRole = 'helper';
          recipientRef = hlp.helper_ref;
          notifyOptedIn = hlp.notify_on_message !== false
            && hlp.availability_status !== 'hidden';
          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('preferred_language')
            .eq('helper_ref', hlp.helper_ref)
            .single();
          recipientLang = prefs?.preferred_language || 'th';
        }
      }

      if (recipientRef && notifyOptedIn) {
        const senderName = session.firstName || 'Someone';
        const preview = trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
        // Video-call invites get an urgent, explicit title — they're the
        // one message type where the recipient should react right away.
        const isVideoCallInvite = /https:\/\/meet\.(?:jit\.si|ffmuc\.net)\/ThaiHelper-[A-Za-z0-9]+/.test(trimmed);
        const titleByLang = isVideoCallInvite
          ? {
              en: `📹 Video call invite from ${senderName}`,
              th: `📹 ${senderName} เชิญคุณเข้าร่วมวิดีโอคอล`,
            }
          : {
              en: `New message from ${senderName}`,
              th: `ข้อความใหม่จาก ${senderName}`,
            };
        await sendPushToUser(recipientRole, recipientRef, {
          title: titleByLang[recipientLang] || titleByLang.en,
          body: preview,
          url: `/profile?tab=messages&conversation=${conversation_id}`,
          conversationId: conversation_id,
        });
      }
    } catch (pushErr) {
      console.error('Push notification failed (non-critical):', pushErr.message);
    }
    };

    const notifyPromise = notifyRecipient();
    try {
      // Only available on Vercel's runtime — guarantees the deferred work
      // completes after the response. Locally the promise runs best-effort.
      const { waitUntil } = require('@vercel/functions');
      waitUntil(notifyPromise);
    } catch {
      /* not on Vercel — fine */
    }

    return res.status(201).json({
      message,
      translationFailed, // client can show a warning toast
    });
  }

  // ─── PUT — Mark incoming messages as read ─────────────────────────────
  if (req.method === 'PUT') {
    const { conversation_id } = req.body || {};
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id required' });
    }

    const conv = await loadConversation(supabase, conversation_id, session);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    // Mark messages from the OTHER party as read
    const otherPartyType = session.role === 'helper' ? 'employer' : 'helper';
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation_id)
      .eq('sender_type', otherPartyType)
      .eq('is_read', false);

    if (error) {
      console.error('Mark read error:', error);
      return res.status(500).json({ error: 'Failed to mark messages as read' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
