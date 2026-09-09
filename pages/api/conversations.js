// GET  /api/conversations — List conversations for the current user (helper or employer)
// POST /api/conversations — Start a new conversation (employer only)
//
// Dual-role: supports both th_session (helper) and th_emp_session (employer).
// Free-tier employers see conversation metadata + blurred last-message preview.
// Helpers always see full content.

import { getAnySession, getSession, getEmployerSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import {
  hasActiveAccess,
  buildMessagePreview,
  getAccessStatus,
} from '../../lib/access';
import { countRateLimit, recordRateLimit } from '../../lib/rate-limit';
import {
  notifyAdminOfSpamSignal,
  OUTREACH_WINDOW_DAYS,
  OUTREACH_ALERT,
  OUTREACH_BLOCK,
  OUTREACH_UNVERIFIED_BLOCK,
  OUTREACH_DAILY_BLOCK,
  outreachCapFor,
} from '../../lib/spam-signals';

const DAY_MS = 24 * 60 * 60 * 1000;
const OUTREACH_BUCKET = 'conversation-start';

/**
 * Bound how many new conversations one account may open.
 *
 * Counted only where a conversation is really created — reopening an existing
 * chat returns early above and costs nothing, so an employer clicking through
 * their inbox is never charged for it.
 *
 * Returns true when the caller may proceed. When it returns false the caller
 * must not create anything; the admin has already been alerted.
 */
async function allowNewConversation(session, phoneVerified) {
  const key = session.ref;
  const windowMs = OUTREACH_WINDOW_DAYS * DAY_MS;
  const cap = outreachCapFor(phoneVerified);

  const [inWindow, today] = await Promise.all([
    countRateLimit({ bucket: OUTREACH_BUCKET, key, windowMs }),
    countRateLimit({ bucket: OUTREACH_BUCKET, key, windowMs: DAY_MS }),
  ]);

  const blocked = inWindow >= cap || today >= OUTREACH_DAILY_BLOCK;

  // One alert per account per day, whether it ends in a block or not.
  if (blocked || inWindow + 1 >= OUTREACH_ALERT) {
    const fresh = await countRateLimit({
      bucket: 'outreach-alert',
      key,
      windowMs: DAY_MS,
    });
    if (fresh === 0) {
      await recordRateLimit({ bucket: 'outreach-alert', key });
      notifyAdminOfSpamSignal({
        subject: `\u{1F6A8} Outreach volume: ${session.role} ${key} (${inWindow} in ${OUTREACH_WINDOW_DAYS}d)`,
        lines: [
          `${key} (${session.role}) has opened ${inWindow} conversations in the last`,
          `${OUTREACH_WINDOW_DAYS} days, ${today} of them in the last 24 hours.`,
          '',
          blocked
            ? `This attempt was BLOCKED (limits: ${cap} per ${OUTREACH_WINDOW_DAYS}d, ${OUTREACH_DAILY_BLOCK} per day).`
            : `Still allowed — alert threshold is ${OUTREACH_ALERT}, block is ${cap}.`,
          phoneVerified
            ? 'Phone: verified.'
            : cap === OUTREACH_BLOCK
              ? 'Phone: not verified, but SMS is not configured yet, so the full cap applies.'
              : `Phone: NOT verified — that is why the cap is ${OUTREACH_UNVERIFIED_BLOCK} rather than ${OUTREACH_BLOCK}.`,
          '',
          'A busy legitimate recruiter does reach the alert threshold — the',
          'highest honest account on record opened 33 in 30 days. Check before',
          `acting: node scripts/suspend-employer.js ${key} --dry-run`,
        ],
      });
    }
  }

  if (blocked) {
    console.warn(`[spam] blocked new conversation from ${key}: ${inWindow} in ${OUTREACH_WINDOW_DAYS}d, ${today} today`);
    return false;
  }

  await recordRateLimit({ bucket: OUTREACH_BUCKET, key });
  return true;
}

export default async function handler(req, res) {
  // The caller can pin which side it expects via ?role=employer or
  // ?role=helper. This avoids a stale helper cookie hijacking the
  // employer-dashboard's conversation list (and vice versa) when both
  // cookies happen to be set in the same browser. When no hint is
  // given we fall back to getAnySession but PREFER employer, since
  // most multi-cookie users on this platform are employers who tested
  // a helper account once.
  const roleHint = req.query.role;
  let session;
  if (roleHint === 'employer') {
    const emp = await getEmployerSession(req);
    session = emp ? { ...emp, role: 'employer' } : null;
  } else if (roleHint === 'helper') {
    const h = await getSession(req);
    session = h ? { ...h, role: 'helper' } : null;
  } else {
    // Reverse the default order — employer first, then helper. Same
    // logic as getAnySession but flipped: a stale helper cookie no
    // longer hijacks an employer's conversation list. Helpers who
    // happen to also have an employer cookie should pass ?role=helper.
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

  // Preload employer state for paywall checks
  let employer = null;
  let employerHasAccess = true;
  if (isEmployer) {
    const { data } = await supabase
      .from('employer_accounts')
      // email_verified is the access gate as of 2026-06-09 (see
      // lib/access.js); without it loaded here, hasActiveAccess
      // sees undefined and blocks every conversation start.
      .select('employer_ref, first_name, preferred_language, access_until, access_tier, email_verified, status, phone_verified_at')
      .eq('employer_ref', session.ref)
      .single();
    if (!data) return res.status(401).json({ error: 'Not authenticated' });
    employer = data;
    employerHasAccess = hasActiveAccess(employer);
  }

  // ─── GET conversation list ────────────────────────────────────────────
  if (req.method === 'GET') {
    const filterColumn = isEmployer ? 'employer_id' : 'helper_ref';
    const filterValue = session.ref;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, helper_ref, employer_id, employer_name, last_message_at, created_at')
      .eq(filterColumn, filterValue)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Conversations list error:', error);
      return res.status(500).json({ error: 'Failed to load conversations' });
    }

    // --- Batch the per-conversation lookups to avoid a 3N+1 query storm ---
    // (counterparty profiles + unread counts in ONE query each instead of one
    //  per conversation). The last-message preview stays per-conversation.
    const otherPartyType = isEmployer ? 'helper' : 'employer';
    const convIds = (conversations || []).map((c) => c.id);
    const counterRefs = [...new Set(
      (conversations || []).map((c) => (isEmployer ? c.helper_ref : c.employer_id)).filter(Boolean)
    )];

    // Counterparty profiles, one .in() query → Map keyed by ref.
    const cpMap = new Map();
    if (counterRefs.length) {
      if (isEmployer) {
        const { data: hs } = await supabase
          .from('helper_profiles')
          .select('helper_ref, first_name, last_name, photo_url, category, city')
          .in('helper_ref', counterRefs);
        for (const h of hs || []) {
          cpMap.set(h.helper_ref, {
            ref: h.helper_ref,
            firstName: h.first_name,
            lastName: h.last_name ? h.last_name.charAt(0) + '.' : '',
            photo: h.photo_url || null,
            category: h.category,
            city: h.city,
          });
        }
      } else {
        const { data: es } = await supabase
          .from('employer_accounts')
          .select('employer_ref, first_name, last_name, city')
          .in('employer_ref', counterRefs);
        for (const e of es || []) {
          cpMap.set(e.employer_ref, {
            ref: e.employer_ref,
            firstName: e.first_name,
            lastName: e.last_name ? e.last_name.charAt(0) + '.' : '',
            photo: null,
            city: e.city,
          });
        }
      }
    }

    // Unread counts from the other party, one query → tally per conversation.
    const unreadMap = new Map();
    if (convIds.length) {
      const { data: unreadRows } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('is_read', false)
        .eq('sender_type', otherPartyType);
      for (const m of unreadRows || []) {
        unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
      }
    }

    const enriched = await Promise.all(
      (conversations || []).map(async (conv) => {
        const count = unreadMap.get(conv.id) || 0;

        // Last message for preview (cheap single-row query, left per-conv).
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content_original, content_translated, sender_type, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Counterparty from the batched map; fall back to the denormalised
        // employer_name on the conversation row if the account is missing.
        let counterparty = cpMap.get(isEmployer ? conv.helper_ref : conv.employer_id) || null;
        if (!counterparty && !isEmployer) {
          counterparty = {
            ref: conv.employer_id,
            firstName: conv.employer_name || 'Employer',
            lastName: '',
            photo: null,
          };
        }

        // Paywall-aware last message preview
        let lastMessage = null;
        if (lastMsg) {
          const source = lastMsg.content_translated || lastMsg.content_original || '';
          if (isEmployer && !employerHasAccess) {
            const { preview, fullLength } = buildMessagePreview(source, 3);
            lastMessage = {
              preview,
              full_length: fullLength,
              is_locked: true,
              sender_type: lastMsg.sender_type,
              created_at: lastMsg.created_at,
            };
          } else {
            lastMessage = {
              preview: source.slice(0, 120),
              is_locked: false,
              sender_type: lastMsg.sender_type,
              created_at: lastMsg.created_at,
            };
          }
        }

        return {
          id: conv.id,
          created_at: conv.created_at,
          last_message_at: conv.last_message_at,
          unread_count: count || 0,
          counterparty,
          last_message: lastMessage,
        };
      })
    );

    // Filter out empty conversations (no messages sent/received yet)
    const withMessages = enriched.filter(c => c.last_message !== null);

    return res.status(200).json({
      conversations: withMessages,
      accessStatus: isEmployer ? getAccessStatus(employer) : null,
    });
  }

  // ─── POST — Start a new conversation (employer or helper) ─────────────
  if (req.method === 'POST') {
    if (isEmployer) {
      // ── Employer → Helper flow (existing) ──
      // 2026-06-09: paywall removed. employerHasAccess now means
      // "email verified" (see lib/access.js). Unverified employers
      // can browse helpers but not start conversations.
      if (!employerHasAccess) {
        return res.status(403).json({
          error: 'email_not_verified',
          accessStatus: getAccessStatus(employer),
        });
      }

      const { helper_ref } = req.body || {};
      if (!helper_ref) {
        return res.status(400).json({ error: 'helper_ref required' });
      }

      const { data: helper } = await supabase
        .from('helper_profiles')
        .select('helper_ref, first_name, availability_status')
        .eq('helper_ref', helper_ref)
        .single();
      if (!helper) return res.status(404).json({ error: 'Helper not found' });

      // The helper took their profile offline. They're already filtered out
      // of the browse list, but a favourite or an old link can still reach
      // here — don't start a conversation they'd never want.
      if (helper.availability_status === 'hidden') {
        return res.status(403).json({ error: 'helper_unavailable' });
      }

      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('helper_ref', helper_ref)
        .eq('employer_id', employer.employer_ref)
        .maybeSingle();

      if (existing) {
        return res.status(200).json({ conversation_id: existing.id, existed: true });
      }

      if (!(await allowNewConversation(session, !!employer.phone_verified_at))) {
        return res.status(429).json({ error: 'outreach_limit' });
      }

      const { data: created, error: convErr } = await supabase
        .from('conversations')
        .insert({
          helper_ref,
          employer_id: employer.employer_ref,
          employer_name: employer.first_name,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convErr) {
        console.error('Conversation create error:', convErr);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      return res.status(201).json({ conversation_id: created.id, existed: false });
    } else {
      // ── Helper → Employer flow (new) ──
      // Employers are gated by employerHasAccess above; helpers were not
      // gated at all, so a suspended helper could still open new chats.
      const { data: senderHelper } = await supabase
        .from('helper_profiles')
        .select('status, phone_verified_at')
        .eq('helper_ref', session.ref)
        .single();
      if (senderHelper?.status === 'suspended') {
        return res.status(403).json({ error: 'account_suspended' });
      }

      const { employer_ref } = req.body || {};
      if (!employer_ref) {
        return res.status(400).json({ error: 'employer_ref required' });
      }

      // Verify the employer account exists
      const { data: emp } = await supabase
        .from('employer_accounts')
        .select('employer_ref, first_name')
        .eq('employer_ref', employer_ref)
        .single();
      if (!emp) return res.status(404).json({ error: 'Employer not found' });

      // Find or create (one conversation per helper/employer pair)
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('helper_ref', session.ref)
        .eq('employer_id', employer_ref)
        .maybeSingle();

      if (existing) {
        return res.status(200).json({ conversation_id: existing.id, existed: true });
      }

      if (!(await allowNewConversation(session, !!senderHelper?.phone_verified_at))) {
        return res.status(429).json({ error: 'outreach_limit' });
      }

      const { data: created, error: convErr } = await supabase
        .from('conversations')
        .insert({
          helper_ref: session.ref,
          employer_id: employer_ref,
          employer_name: emp.first_name,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convErr) {
        console.error('Conversation create error:', convErr);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      return res.status(201).json({ conversation_id: created.id, existed: false });
    }
  }

  // ─── DELETE — Remove a conversation and all its messages ────────────
  if (req.method === 'DELETE') {
    const { conversation_id } = req.query;
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id required' });
    }

    // Verify the user owns this conversation
    const filterColumn = isEmployer ? 'employer_id' : 'helper_ref';
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .eq(filterColumn, session.ref)
      .maybeSingle();

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Delete all messages first (FK constraint)
    const { error: msgErr } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversation_id);

    if (msgErr) {
      console.error('Messages delete error:', msgErr);
      return res.status(500).json({ error: 'Failed to delete messages' });
    }

    // Delete the conversation
    const { error: convErr } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation_id);

    if (convErr) {
      console.error('Conversation delete error:', convErr);
      return res.status(500).json({ error: 'Failed to delete conversation' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
