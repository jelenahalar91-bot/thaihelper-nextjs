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
  isSolicitation,
  mentionsPersonalService,
  documentRequestKind,
  documentRequestSpread,
  DOC_SCREEN_SPREAD_ALERT,
  shortenerLinks,
  CONTACT_SPREAD_ALERT,
  CONTACT_SPREAD_BLOCK,
  CONTACT_SPREAD_WINDOW_DAYS,
  notifyAdminOfSpamSignal,
  outreachGate,
  recordOutreach,
  suspendCommand,
  overseasPlacement,
  placementAbroad,
} from '../../lib/spam-signals';
import { notifyContactedHelpers } from '../../lib/emails/suspended-contact-notice';
import { blockedHandlesIn, linkHandles } from '../../lib/contact-blocklist';
import { helperOpenedTheDoor, linkSpread } from '../../lib/contact-invite';
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

// How far back the contact-link alert reads the thread. Long enough that an
// invitation does not fall out of view while the family is away: replayed
// over the whole corpus on 2026-11-19, the longest gap between the helper's
// invitation and the family's answer was 7 messages and 130 minutes. Short
// enough to stay one indexed query.
const CONTACT_LINK_HISTORY = 50;

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
      `account before acting: ${suspendCommand(senderRef)}`,
    ].join('\n'),
  });
}

// Tell the admin inbox that somebody is asking for identity documents.
//
// Alert only, never a block, and that is deliberate. A family that travels has
// a real reason to ask whether a nanny holds a passport, and a helper applying
// for a live-in job abroad has a real reason to answer. What cannot be judged
// by a regex is which of those is happening — so a human reads it, and nobody's
// message is stopped on a guess.
async function notifyAdminOfDocumentRequest({ senderRef, senderType, kind, spread, sample }) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const asked = kind === 'send';
  await resend.emails.send({
    from: 'ThaiHelper <noreply@thaihelper.app>',
    to: process.env.ADMIN_EMAIL,
    subject: asked
      ? `\u{1F6A8} Asked for an ID document: ${senderType} ${senderRef}`
      : `\u{1F6A8} Screening for passports: ${senderType} ${senderRef} (${spread} people)`,
    text: [
      ...(asked
        ? [
            `${senderRef} (${senderType}) has asked somebody to SEND a photo or copy`,
            'of a passport or ID card through ThaiHelper.',
            '',
            'A passport image cannot be taken back. It is enough to open accounts or',
            'apply for visas in her name, and it is the standard first step when a',
            'domestic worker is being moved abroad. There is no reason to need one',
            'here: hiring happens in person, and we have never asked for documents.',
          ]
        : [
            `${senderRef} (${senderType}) has asked ${spread} different people whether`,
            `they hold a passport or ID, within the last ${CONTACT_SPREAD_WINDOW_DAYS} days.`,
            '',
            'Asking one person is ordinary — families who travel need to know. Asking',
            'this many is screening a list, which is what recruitment for work abroad',
            `looks like. Everyone else on record has asked at most 2 people.`,
          ]),
      '',
      'The message:',
      sample,
      '',
      'Nothing was blocked and the message was delivered.',
      `Read the conversation before acting: ${suspendCommand(senderRef)}`,
    ].join('\n'),
  });
}

// Suspend a family that was warned in writing and did it again.
//
// The only place on this platform where a suspension is decided by a pattern
// rather than by somebody reading the conversation, and it is narrow on
// purpose: it fires ONLY for an account whose warned_for column says a human
// already read its messages, wrote to it, and told it exactly this would
// happen. Everything else gets an alert and the message goes through.
async function suspendForRepeatSolicitation(supabase, ref, sample) {
  const reason = 'Asked a helper for a personal service again after a written warning'
    + ` (warned earlier, see warned_at). The message: "${String(sample).slice(0, 180)}"`
    + ' — suspended automatically by /api/messages, see isSolicitation() in lib/spam-signals.js.';
  const { error } = await supabase
    .from('employer_accounts')
    .update({
      status: 'suspended',
      status_reason: reason,
      status_changed_at: new Date().toISOString(),
      search_status: 'hidden',
      notify_on_message: false,
    })
    .eq('employer_ref', ref);
  if (error) console.error('[solicitation] suspend failed:', error.message);
  return !error;
}

// Suspend a family offering a job in another country and asking for papers.
//
// The second place on this platform where a pattern decides a suspension, and
// unlike the first (suspendForRepeatSolicitation, which needs a human warning
// on file) this one fires on the first message. overseasPlacement() carries
// the argument for that; the short version is that ThaiHelper is for
// households in Thailand, no family account can lawfully place anybody
// abroad from here, and the first letter is already the whole harm.
async function suspendForOverseasPlacement(supabase, ref, sample, hit) {
  const reason = `Offered a job outside Thailand (${hit.place}) and demanded identity`
    + ` documents in the same message (${hit.documents}). The message: "${String(sample).slice(0, 180)}"`
    + ' — suspended automatically by /api/messages, see overseasPlacement() in lib/spam-signals.js.';
  const { error } = await supabase
    .from('employer_accounts')
    .update({
      status: 'suspended',
      status_reason: reason,
      status_changed_at: new Date().toISOString(),
      search_status: 'hidden',
      notify_on_message: false,
    })
    .eq('employer_ref', ref);
  if (error) console.error('[overseas] suspend failed:', error.message);
  return !error;
}

async function notifyAdminOfSolicitation({ senderRef, suspended, asked = true, sample }) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'ThaiHelper <noreply@thaihelper.app>',
    to: process.env.ADMIN_EMAIL,
    subject: suspended
      ? `\u{1F6A8} SUSPENDED: ${senderRef} asked for a massage again after the warning`
      : asked
        ? `\u{1F6A8} ${senderRef} asked a helper for a massage`
        : `\u{1F440} ${senderRef} mentioned massage to a helper`,
    text: [
      suspended
        ? `${senderRef} was warned in writing and has now sent another one. The account`
        : asked
          ? `${senderRef} has asked a helper to massage or stretch them.`
          : `${senderRef} mentioned massage or stretching to a helper. Nobody asked for`
            + ' anything outright, which is why this is a look rather than an alarm —'
            + ' it is the shape a job ad takes when the requirement is written into the'
            + ' wish-list instead (EMP-DZCDRL, 2026-11-10), and also the shape of a'
            + ' perfectly ordinary reply to a helper who advertises massage herself.',
      suspended ? 'has been SUSPENDED automatically and the message was NOT delivered.' : '',
      '',
      'The message:',
      sample,
      '',
      suspended
        ? 'Nothing further is needed. To undo: node scripts/suspend-account.js ' + senderRef + ' --restore'
        : [
            'Nothing has been blocked and the message was delivered.',
            '',
            'Across all 5,958 messages ever sent here, exactly three accounts have ever',
            'tripped this and all three were abusing it — but the obvious false positive',
            'has simply not happened yet, so read the conversation before acting. A family',
            'caring for a bedridden parent asking for help with their legs would look',
            'similar and would be a real household job.',
            '',
            `If it is not: ${suspendCommand(senderRef)}`,
            'Then set warned_for = \'solicitation\' so a repeat suspends itself.',
          ].join('\n'),
    ].filter(Boolean).join('\n'),
  });
}

// Page 1 is the NEWEST messages, not the oldest — see the GET handler.
//
// 200 rather than 50 because 50 was where conversations died. Nothing in the
// web app or the mobile app has ever asked for page 2: all four callers in
// lib/api/messages.js pass 1, and the app sends no page at all. So a thread
// that passed 50 messages showed its participants the first 50 forever and
// swallowed every message after that, in both directions. The largest thread
// on the platform on 2026-11-24 was 74.
const MESSAGES_PER_PAGE = 200;
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
    const { conversation_id, page = '1', before = '' } = req.query;
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id required' });
    }
    if (before && Number.isNaN(Date.parse(before))) {
      return res.status(400).json({ error: 'before must be a timestamp' });
    }

    const conv = await loadConversation(supabase, conversation_id, session);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    // NEWEST FIRST, then turned back round before it goes out.
    //
    // This used to read ascending, which made page 1 the OLDEST messages in
    // the thread. Nothing has ever requested page 2 — the four callers in
    // lib/api/messages.js all pass 1 and the mobile app sends no page at all
    // — so once a conversation passed MESSAGES_PER_PAGE it froze: both sides
    // kept seeing the same first window and every new message vanished.
    //
    // It surfaced on 2026-11-24 through two support mails that read like two
    // different faults and were one: a family saying she could no longer see
    // any correspondence with her helper, and that same helper, three hours
    // earlier, saying she could not send. She could. Her messages were saved
    // and invisible, so she typed them again — the thread has the same
    // message at 281 characters five times over.
    //
    // A chat window wants the end of the conversation, so the query takes the
    // newest and the array is reversed before returning. The response is
    // still oldest-first within the window, which is the order every client
    // already renders.
    //
    // ── Reaching further back ───────────────────────────────────────────
    //
    // `before` is a cursor: the created_at of the oldest message the caller
    // already holds. It asks for the window immediately older than that one,
    // and it is what the "load older messages" controls send.
    //
    // A cursor and not a page number, because the thread grows at the newest
    // end while someone is reading the oldest. With offsets, one message
    // arriving between two requests shifts every window along by one, and the
    // message at the seam is never shown to the reader at all — the same
    // class of silent loss as the freeze this endpoint was fixed for.
    //
    // The comparison is inclusive, so two messages written inside the same
    // microsecond can never end up either side of the boundary with one of
    // them dropped. The cursor message itself comes back with the window and
    // every client merges by id, where it lands on the copy already held.
    //
    // `page` stays for the callers that still send it (all of them send 1;
    // the shipped mobile app sends nothing) — an offset and a cursor would
    // fight, so a cursor overrides it.
    const offset = before ? 0 : (parseInt(page, 10) - 1) * MESSAGES_PER_PAGE;

    let query = supabase
      .from('messages')
      .select(
        'id, conversation_id, sender_type, sender_ref, content_original, ' +
        'content_translated, source_language, target_language, is_read, created_at'
      )
      .eq('conversation_id', conversation_id);
    if (before) query = query.lte('created_at', before);

    // One row past the window, only to answer "is there anything older?".
    // It is cut off again below and never reaches a client.
    const { data: probed, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + MESSAGES_PER_PAGE);

    if (error) {
      console.error('Messages fetch error:', error);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    const rows = probed || [];
    const hasMore = rows.length > MESSAGES_PER_PAGE;
    const inOrder = rows.slice(0, MESSAGES_PER_PAGE).reverse();

    // Mask content for free-tier employers
    const payload = inOrder.map((m) =>
      isEmployer ? maskMessageForEmployer(m, employerHasAccess) : { ...m, is_locked: false }
    );

    return res.status(200).json({
      messages: payload,
      // Whether messages exist older than the window just returned. Clients
      // that know nothing about it carry on as before.
      hasMore,
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
    // warned_for lives on employer_accounts only, and is read in exactly one
    // place: the employer-only solicitation branch further down. Asking for it
    // on helper_profiles makes PostgREST reject the whole query (42703) — and
    // because only `data` was destructured here, that failure arrived as
    // senderRow === null and every helper was refused with
    // 'email_not_verified'. Helper messaging was down for a morning that way.
    const senderCols = isEmployer
      ? 'email_verified, status, phone_verified_at, created_at, warned_for, first_name'
      : 'email_verified, status, phone_verified_at, created_at';
    const { data: senderRow, error: senderErr } = await supabase
      .from(senderTable)
      .select(senderCols)
      .eq(senderRefCol, session.ref)
      .single();
    // A query that failed says nothing about this account. Answering it with a
    // verification notice sends a verified person off to re-verify an address
    // that was never the problem — the misdiagnosis above, in one line. Fail
    // loudly instead, so the next schema slip shows up as an error and not as
    // a wrong instruction to a user.
    if (senderErr) {
      console.error(`[messages] sender lookup failed for ${session.ref}:`, senderErr.message);
      return res.status(500).json({ error: 'Failed to send message' });
    }
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

    // Don't let a helper write into the void. Once a family is past the
    // phone-verification deadline it cannot reply, and 125 families had a live
    // conversation when this was written — without this check the helper keeps
    // writing and concludes she is being ignored, which is worse for her than
    // being told plainly that the other side is unreachable right now.
    //
    // The wording the client shows says "not reachable", never "blocked" or
    // "suspended": the helper does not need, and should not be handed, another
    // account's moderation state.
    if (!isEmployer) {
      const { data: other } = await supabase
        .from('employer_accounts')
        .select('status, email_verified, created_at, phone_verified_at')
        .eq('employer_ref', conv.employer_id)
        .maybeSingle();
      if (other && !hasActiveAccess(other)) {
        return res.status(409).json({ error: 'recipient_unavailable' });
      }
    }

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

    // Anti-trafficking: a job on the other side of the world.
    //
    // ThaiHelper is for household jobs in Thailand. An account offering work
    // in another country AND demanding a passport, an ID card or a police
    // record in the same message is suspended here and now, the message is
    // not delivered, and every helper it has already written to is told why
    // within the minute. See overseasPlacement() in lib/spam-signals.js for
    // the argument for acting rather than alerting, and
    // scripts/calibrate-overseas-placement.js for what this would have done
    // to all 4,117 employer messages ever sent here: one account, EMP-TLZAVL,
    // three days and eighteen women before a person caught it by hand.
    if (isEmployer) {
      const abroad = overseasPlacement(trimmed);
      if (abroad) {
        const suspended = await suspendForOverseasPlacement(supabase, session.ref, trimmed, abroad);
        // Only write to the helpers if the suspension actually landed — a
        // letter saying "the account has been blocked" has to be true.
        const notice = suspended
          ? await notifyContactedHelpers({
            supabase,
            employerRef: session.ref,
            caseKey: 'AUTO-OVERSEAS',
            label: senderRow?.first_name || session.ref,
          })
          : { sent: 0, failed: 0, total: 0 };
        console.warn(`[overseas] suspended ${session.ref} (${abroad.place}), wrote to ${notice.sent} helper(s)`);
        if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
          notifyAdminOfSpamSignal({
            subject: `\u{1F6A8} SUSPENDED: ${session.ref} offered a job in ${abroad.place}`,
            lines: [
              `${session.ref} offered work outside Thailand and asked for identity`,
              `documents in the same message (place: ${abroad.place}, documents: ${abroad.documents}).`,
              '',
              suspended
                ? 'The account has been SUSPENDED automatically and the message was NOT delivered.'
                : 'THE SUSPENSION FAILED TO WRITE — the account is still active. Act by hand.',
              notice.total
                ? `${notice.sent} of ${notice.total} helper(s) it had already written to have been told why`
                  + `${notice.failed ? `, ${notice.failed} mail(s) failed` : ''}.`
                : 'It had not written to anybody else yet.',
              '',
              'The message:',
              trimmed.slice(0, 400),
              '',
              'This rule has fired on exactly one account in the platform\'s history',
              '(EMP-TLZAVL, 2026-11-11). If this one is a real family — a trip is not a',
              'workplace, and the rule is built to tell them apart — undo it with:',
              `  node scripts/suspend-account.js ${session.ref} --restore`,
              'and the helpers will need a correction by hand.',
            ],
          }).catch((e) => console.error('Overseas alert failed:', e.message));
        }
        return res.status(403).json({ error: 'account_suspended' });
      }

      // A job abroad with no document demand only alerts. "Will u be
      // interested to work in Sydney" (EMP-ESWAAB) looks exactly like a family
      // asking "did you work in Hong Kong before?", and the second one must
      // not cost anybody an account. Seven accounts in seven months.
      const mentioned = placementAbroad(trimmed);
      if (mentioned) {
        const fresh = await checkRateLimit({
          bucket: 'placement-abroad-alert',
          key: session.ref,
          max: 1,
          windowMs: 24 * 60 * 60 * 1000,
        });
        if (fresh && process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
          notifyAdminOfSpamSignal({
            subject: `\u{1F30F} ${session.ref} mentioned work in ${mentioned.place}`,
            lines: [
              `${session.ref} wrote to a helper about work in ${mentioned.place}.`,
              '',
              'No documents were asked for, so nothing was blocked and the message',
              'was delivered. Most of these are ordinary — a family that used to live',
              'abroad, or one asking where she has worked before. The one that was',
              'not ordinary was EMP-ESWAAB: "will u be interested to work in Sydney".',
              '',
              'The message:',
              trimmed.slice(0, 400),
              '',
              `If it is recruitment: ${suspendCommand(session.ref)}`,
            ],
          }).catch((e) => console.error('Placement alert failed:', e.message));
        }
      }
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
        // The conversation so far, oldest first. The alert used to show the
        // link and nothing else, which made every one of them a database
        // query before it could be judged: on 2026-10-26 EMP-HS6UKE was
        // flagged for answering a helper who had just written "How can I
        // apply?" — the sentence that settles the case was one line above the
        // quoted message and not in the mail. A helper asking for the handle
        // reads very differently from a family volunteering it unprompted.
        //
        // The mail shows the last three turns; the suppression below reads
        // the whole thread, because the invitation and the answer can be an
        // hour and several messages apart (EMP-XG6SYL, 2026-11-19).
        //
        // This message is not written yet (the insert is further down), so
        // the newest row here is genuinely the one before it.
        const { data: before } = await supabase
          .from('messages')
          .select('sender_type, content_original, content_translated, created_at')
          .eq('conversation_id', conversation_id)
          .order('created_at', { ascending: false })
          .limit(CONTACT_LINK_HISTORY);
        const history = (before || []).reverse();

        // She asked first, and this account has not linked at anybody else —
        // see lib/contact-invite.js for why both halves are needed. No mail,
        // and no token spent either: a suppressed conversation must not use
        // up the account's one alert for the day and hide a spray sent an
        // hour later at somebody who said nothing at all.
        const asked = helperOpenedTheDoor(history);
        const spread = asked ? await linkSpread(supabase, session.ref, conversation_id) : 0;
        const invited = asked && spread === 0 ? asked : null;
        const fresh = invited ? false : await checkRateLimit({
          bucket: 'employer-contact-link-alert',
          key: session.ref,
          max: 1,
          windowMs: 24 * 60 * 60 * 1000,
        });
        if (invited) {
          console.log(
            `Contact-link alert suppressed for ${session.ref}: helper ${invited.reason}`
            + ` — "${invited.text.slice(0, 120)}"`
          );
        }
        if (fresh) {
          const { data: acct } = await supabase
            .from('employer_accounts')
            .select('first_name, last_name, email, created_at')
            .eq('employer_ref', session.ref)
            .maybeSingle();
          const ageHours = acct
            ? Math.round((Date.now() - new Date(acct.created_at)) / 36e5)
            : null;

          const context = history.slice(-3).flatMap((m) => {
            const who = m.sender_type === 'helper' ? 'Helper  ' : 'Family  ';
            const out = [`  ${who} ${(m.content_original || '').slice(0, 200)}`];
            // Thai and Burmese arrive translated; the English is what tells you
            // whether she asked for the handle.
            if (m.content_translated && m.content_translated !== m.content_original) {
              out.push(`           ↳ ${m.content_translated.slice(0, 200)}`);
            }
            return out;
          });

          notifyAdminOfSpamSignal({
            subject: `\u{1F517} Family sent a contact link: ${session.ref}`,
            lines: [
              `${acct ? `${acct.first_name} ${acct.last_name} <${acct.email}>` : session.ref}`,
              `Account ${session.ref}, registered ${ageHours !== null ? `${ageHours}h ago` : 'unknown'}.`,
              '',
              'Sent a tap-to-open contact link to a helper:',
              ...links.map((h) => `  ${h}`),
              '',
              ...(context.length
                ? ['How the conversation got there:', ...context, '']
                : ['Nothing was said in this conversation before it.', '']),
              // The only way an alert still arrives after the helper asked:
              // the same account is linking at other people too. Say so, or
              // this mail reads like the false positive it is not.
              ...(asked ? [
                `She ${asked.reason} first — this would be suppressed, except the`,
                `account has sent a link into ${spread} other conversation(s) in 30 days.`,
                '',
              ] : []),
              'Message:',
              `  Family   ${trimmed.slice(0, 300)}`,
              '',
              'Families have no reason to send these — every one in the 30 days',
              'before 2026-09-15 came from a confirmed scam account. The ordinary',
              'exception is a helper who asked for it first ("how can I apply?",',
              '"what is your LINE?", a number of her own) — since 2026-11-19 those',
              'are suppressed, so this one is either unprompted or came from an',
              'account that is linking at other people too. Read the turns above,',
              'then:',
              `  ${suspendCommand(session.ref)}`,
            ],
          }).catch((e) => console.error('Contact-link alert failed:', e.message));
        }
      }
    }

    // Anti-spam: approaching somebody who has not spoken to you is outreach,
    // and this is where it actually happens. /api/conversations refuses to
    // create the room when the account is over its limit, but the room can
    // already exist — empty threads are free and invisible, so an account
    // could open a hundred of them while the counter sat at zero and then
    // write into all of them. The first message is the moment somebody is
    // really reached, so it is the moment that is counted and capped.
    const { count: priorMessages } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversation_id);
    const isOutreach = (priorMessages || 0) === 0;
    if (isOutreach) {
      const denied = await outreachGate({
        ref: session.ref,
        role: session.role,
        phoneVerified: !!senderRow?.phone_verified_at,
        createdAt: senderRow?.created_at,
      });
      if (denied) {
        return res.status(429).json({
          error: denied === 'phone' ? 'outreach_limit_phone' : 'outreach_limit',
        });
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

    // Asking the helper for a personal service.
    //
    // People sign up here to clean, cook and mind children. Being asked to
    // massage the person who hired them is a different job, asked of somebody
    // who is often alone in a stranger's home. See isSolicitation().
    if (isEmployer && (isSolicitation(trimmed) || mentionsPersonalService(trimmed))) {
      // Suspension needs BOTH a warning and an actual request. The broader
      // test only ever raises a flag — an ad that lists "Thai massage" among
      // its wishes is worth reading, not worth an automatic ban.
      const warned = senderRow?.warned_for === 'solicitation' && isSolicitation(trimmed);
      if (warned) {
        // The warning letter said this would happen. Suspend first, then
        // refuse — so the message does not reach the helper even if the mail
        // to the admin fails.
        const done = await suspendForRepeatSolicitation(supabase, session.ref, trimmed);
        if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
          notifyAdminOfSolicitation({ senderRef: session.ref, suspended: done, sample: trimmed })
            .catch((e) => console.error('Solicitation alert failed:', e.message));
        }
        console.warn(`[solicitation] suspended ${session.ref} for a repeat after warning`);
        return res.status(403).json({ error: 'account_suspended' });
      }
      // Never warned: a human reads it. One mail per account per day.
      const fresh = await checkRateLimit({
        bucket: 'solicitation-alert',
        key: session.ref,
        max: 1,
        windowMs: 24 * 60 * 60 * 1000,
      });
      if (fresh && process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
        notifyAdminOfSolicitation({
          senderRef: session.ref,
          suspended: false,
          asked: isSolicitation(trimmed),
          sample: trimmed,
        }).catch((e) => console.error('Solicitation alert failed:', e.message));
      }
    }

    // Anti-trafficking: somebody asking for a passport photo.
    //
    // EMP-SMHEBC asked 15 helpers whether they had a passport and then asked
    // one of them to send a picture of it, five days before anybody noticed.
    // Across all 4,465 messages ever sent here, it is the only account that
    // ever asked for the document itself, and the only one that screened more
    // than two people — so neither branch of this has a precedent among honest
    // users, and both are rare enough to mail about individually.
    const docKind = documentRequestKind(trimmed);
    if (docKind) {
      const docSpread = docKind === 'send'
        ? 1 // one is already too many; no counting needed
        : await documentRequestSpread(supabase, session.ref, trimmed, conversation_id);
      if (docKind === 'send' || docSpread >= DOC_SCREEN_SPREAD_ALERT) {
        const fresh = await checkRateLimit({
          bucket: 'document-request-alert',
          key: session.ref,
          max: 1,
          windowMs: 24 * 60 * 60 * 1000,
        });
        if (fresh && process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
          notifyAdminOfDocumentRequest({
            senderRef: session.ref,
            senderType: session.role,
            kind: docKind,
            spread: docSpread,
            sample: trimmed.slice(0, 300),
          }).catch((e) => console.error('Document-request alert failed:', e.message));
        }
      }
    }

    // Anti-phishing: a shortened link hides where it goes, which is the only
    // reason to use one in a message here. Reported, never blocked — a family
    // may legitimately send one, and blocking would only teach the next
    // attacker to spell the domain differently. What this buys is that a human
    // sees it the same hour: "Support ThaiHelper" sent ten helpers a tinu.be
    // link on 2026-09-27 and it went unnoticed for 21 hours.
    //
    // Google Maps links are excluded in shortenerLinks() — families share their
    // address that way, and they are the only legitimate short link on record.
    const shorteners = shortenerLinks(trimmed);
    if (shorteners.length) {
      const fresh = await checkRateLimit({
        bucket: 'shortener-alert',
        key: session.ref,
        max: 1,
        windowMs: 24 * 60 * 60 * 1000,
      });
      if (fresh && process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
        notifyAdminOfSpamSignal({
          subject: `\u{1F517} Shortened link from ${session.role} ${session.ref} (${shorteners.join(', ')})`,
          lines: [
            `${session.ref} (${session.role}) sent a shortened link in a message.`,
            '',
            'Across every message ever sent, only 14 contain one — ten of them',
            'were the phishing campaign on 2026-09-27. This is worth a look.',
            '',
            'Message:',
            trimmed.slice(0, 400),
            '',
            `Check the account: ${suspendCommand(session.ref)}`,
          ],
        }).catch((e) => console.error('Shortener alert failed:', e.message));
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

    // Counted only now, after the message is really stored: the counter holds
    // people approached, nothing else.
    if (isOutreach) {
      recordOutreach(session.ref).catch((e) =>
        console.error('[spam] outreach record failed:', e.message));
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
            // The recipient's dashboard opens the thread from the OTHER
            // party's ref, i.e. the sender's.
            senderRef: session.role === 'helper' ? conv.helper_ref : conv.employer_id,
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
