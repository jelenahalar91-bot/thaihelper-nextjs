// GET /api/messages?conversation_id=X — Get messages for a conversation
// POST /api/messages — Send a message (with auto-translation)
// PUT /api/messages — Mark messages as read

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { translateText, detectLanguage } from '../../lib/translate';

const MESSAGES_PER_PAGE = 50;

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const { ref } = session;

  // GET messages
  if (req.method === 'GET') {
    const { conversation_id, page = '1' } = req.query;
    if (!conversation_id) return res.status(400).json({ error: 'conversation_id required' });

    // Verify conversation belongs to this helper
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .eq('helper_ref', ref)
      .single();

    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const offset = (parseInt(page) - 1) * MESSAGES_PER_PAGE;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, sender_type, sender_ref, content_original, content_translated, source_language, target_language, is_read, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + MESSAGES_PER_PAGE - 1);

    if (error) {
      console.error('Messages fetch error:', error);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    return res.status(200).json({ messages: messages || [] });
  }

  // POST — Send message
  if (req.method === 'POST') {
    const { conversation_id, content } = req.body;

    if (!conversation_id || !content?.trim()) {
      return res.status(400).json({ error: 'conversation_id and content required' });
    }

    // Verify conversation belongs to this helper
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, employer_id')
      .eq('id', conversation_id)
      .eq('helper_ref', ref)
      .single();

    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    // Detect source language and translate
    let sourceLanguage = null;
    let translatedContent = null;
    let targetLanguage = null;

    try {
      sourceLanguage = await detectLanguage(content.trim());

      // Get employer's preferred language (if we had it)
      // For now, translate to English if source isn't English, or to Thai if source is English
      if (sourceLanguage && sourceLanguage !== 'en') {
        targetLanguage = 'en';
      } else if (sourceLanguage === 'en') {
        targetLanguage = 'th';
      }

      if (targetLanguage) {
        const result = await translateText(content.trim(), targetLanguage, sourceLanguage);
        if (result) {
          translatedContent = result.translatedText;
          sourceLanguage = result.detectedSourceLanguage || sourceLanguage;
        }
      }
    } catch (err) {
      console.error('Translation error (non-critical):', err.message);
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_type: 'helper',
        sender_ref: ref,
        content_original: content.trim(),
        content_translated: translatedContent,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        is_read: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Message insert error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation_id);

    return res.status(201).json({ message });
  }

  // PUT — Mark as read
  if (req.method === 'PUT') {
    const { conversation_id } = req.body;
    if (!conversation_id) return res.status(400).json({ error: 'conversation_id required' });

    // Verify ownership
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .eq('helper_ref', ref)
      .single();

    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation_id)
      .eq('sender_type', 'employer')
      .eq('is_read', false);

    if (error) {
      console.error('Mark read error:', error);
      return res.status(500).json({ error: 'Failed to mark messages as read' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
