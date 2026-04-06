// GET /api/conversations — List conversations for authenticated helper

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServiceSupabase();
  const { ref } = session;

  // Get conversations with unread count
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, employer_id, employer_name, last_message_at, created_at')
    .eq('helper_ref', ref)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Conversations list error:', error);
    return res.status(500).json({ error: 'Failed to load conversations' });
  }

  // Get unread counts and last message preview for each conversation
  const enriched = await Promise.all(
    (conversations || []).map(async (conv) => {
      // Unread count
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', false)
        .eq('sender_type', 'employer');

      // Last message preview
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content_original, content_translated, sender_type, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...conv,
        unread_count: count || 0,
        last_message: lastMsg ? {
          preview: (lastMsg.content_translated || lastMsg.content_original || '').substring(0, 80),
          sender_type: lastMsg.sender_type,
          created_at: lastMsg.created_at,
        } : null,
      };
    })
  );

  return res.status(200).json({ conversations: enriched });
}
