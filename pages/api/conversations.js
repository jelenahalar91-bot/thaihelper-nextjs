// GET  /api/conversations — List conversations for the current user (helper or employer)
// POST /api/conversations — Start a new conversation (employer only)
//
// Dual-role: supports both th_session (helper) and th_emp_session (employer).
// Free-tier employers see conversation metadata + blurred last-message preview.
// Helpers always see full content.

import { getAnySession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import {
  hasActiveAccess,
  buildMessagePreview,
  getAccessStatus,
} from '../../lib/access';

export default async function handler(req, res) {
  const session = await getAnySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const isEmployer = session.role === 'employer';

  // Preload employer state for paywall checks
  let employer = null;
  let employerHasAccess = true;
  if (isEmployer) {
    const { data } = await supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, preferred_language, access_until, access_tier')
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

    // Enrich each conversation with unread count, counterparty info,
    // and a masked last-message preview.
    const enriched = await Promise.all(
      (conversations || []).map(async (conv) => {
        const otherPartyType = isEmployer ? 'helper' : 'employer';

        // Count unread messages from the other party
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .eq('sender_type', otherPartyType);

        // Last message for preview
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content_original, content_translated, sender_type, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Load counterparty info (for avatar / name in the sidebar)
        let counterparty = null;
        if (isEmployer) {
          const { data: h } = await supabase
            .from('helper_profiles')
            .select('helper_ref, first_name, last_name, photo_url, category, city')
            .eq('helper_ref', conv.helper_ref)
            .maybeSingle();
          if (h) {
            counterparty = {
              ref: h.helper_ref,
              firstName: h.first_name,
              lastName: h.last_name ? h.last_name.charAt(0) + '.' : '',
              photo: h.photo_url || null,
              category: h.category,
              city: h.city,
            };
          }
        } else {
          const { data: e } = await supabase
            .from('employer_accounts')
            .select('employer_ref, first_name, last_name, city')
            .eq('employer_ref', conv.employer_id)
            .maybeSingle();
          if (e) {
            counterparty = {
              ref: e.employer_ref,
              firstName: e.first_name,
              lastName: e.last_name ? e.last_name.charAt(0) + '.' : '',
              photo: null,
              city: e.city,
            };
          } else {
            counterparty = {
              ref: conv.employer_id,
              firstName: conv.employer_name || 'Employer',
              lastName: '',
              photo: null,
            };
          }
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
      if (!employerHasAccess) {
        return res.status(402).json({
          error: 'payment_required',
          accessStatus: getAccessStatus(employer),
        });
      }

      const { helper_ref } = req.body;
      if (!helper_ref) {
        return res.status(400).json({ error: 'helper_ref required' });
      }

      const { data: helper } = await supabase
        .from('helper_profiles')
        .select('helper_ref, first_name')
        .eq('helper_ref', helper_ref)
        .single();
      if (!helper) return res.status(404).json({ error: 'Helper not found' });

      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('helper_ref', helper_ref)
        .eq('employer_id', employer.employer_ref)
        .maybeSingle();

      if (existing) {
        return res.status(200).json({ conversation_id: existing.id, existed: true });
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
      const { employer_ref } = req.body;
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
