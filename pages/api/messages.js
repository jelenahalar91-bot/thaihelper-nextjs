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

import { getAnySession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { translateText, detectLanguage } from '../../lib/translate';
import {
  hasActiveAccess,
  maskMessageForEmployer,
  getAccessStatus,
} from '../../lib/access';
import { sendNewMessageNotification } from '../../lib/send-confirmation-email';
import { createUnsubscribeToken, buildUnsubscribeUrl } from '../../lib/unsubscribe';

const MESSAGES_PER_PAGE = 50;
// Max characters per message. Generous enough for long Thai replies but
// prevents abuse (dumping huge blobs into the DB, bloating translation cost).
const MAX_MESSAGE_LENGTH = 4000;

// Look up the current employer's live access state from the database.
// We never trust the JWT for access state — it's 30 days old.
async function loadEmployer(supabase, employerRef) {
  const { data } = await supabase
    .from('employer_accounts')
    .select('employer_ref, preferred_language, access_until, access_tier')
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
  const session = await getAnySession(req);
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
    // Free-tier employers cannot send messages
    if (isEmployer && !employerHasAccess) {
      return res.status(402).json({
        error: 'payment_required',
        accessStatus: getAccessStatus(employer),
      });
    }

    const { conversation_id, content } = req.body;
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

    const conv = await loadConversation(supabase, conversation_id, session);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

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
        is_read: true, // sender has read their own message
      })
      .select()
      .single();

    if (error) {
      console.error('Message insert error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Bump conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation_id);

    // Send email notification to recipient (non-blocking — don't fail the request).
    // We gate on the recipient's `notify_on_message` flag so opted-out users
    // don't get any more notifications, and we include a signed one-click
    // unsubscribe URL in every email + RFC 8058 List-Unsubscribe headers.
    try {
      if (process.env.RESEND_API_KEY) {
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
            .select('first_name, email, notify_on_message, helper_ref')
            .eq('helper_ref', conv.helper_ref)
            .single();
          if (hlp) {
            recipientEmail = hlp.email;
            recipientName = hlp.first_name;
            recipientRole = 'helper';
            recipientRef = hlp.helper_ref;
            notifyOptedIn = hlp.notify_on_message !== false;
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
            messagePreview: trimmed,
            unsubscribeUrl,
          });
        }
      }
    } catch (notifyErr) {
      console.error('Message notification email failed (non-critical):', notifyErr.message);
    }

    return res.status(201).json({
      message,
      translationFailed, // client can show a warning toast
    });
  }

  // ─── PUT — Mark incoming messages as read ─────────────────────────────
  if (req.method === 'PUT') {
    const { conversation_id } = req.body;
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
