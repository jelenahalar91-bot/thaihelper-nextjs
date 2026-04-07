/**
 * Client-side API functions for messaging.
 */

export async function fetchConversations() {
  const res = await fetch('/api/conversations');
  if (res.status === 401) return { conversations: [] };
  return res.json();
}

export async function fetchMessages(conversationId, page = 1) {
  const res = await fetch(`/api/messages?conversation_id=${conversationId}&page=${page}`);
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

export async function sendMessage(conversationId, content) {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send message');
  }

  return res.json();
}

/**
 * Start a new conversation as an employer with a given helper.
 * Returns { conversation_id, existed }.
 * Throws on 402 payment_required (free tier without access).
 */
export async function startConversation(helperRef) {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ helper_ref: helperRef }),
  });

  if (res.status === 402) {
    const err = new Error('payment_required');
    err.code = 'payment_required';
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to start conversation');
  }

  return res.json();
}

export async function markAsRead(conversationId) {
  const res = await fetch('/api/messages', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId }),
  });

  if (!res.ok) throw new Error('Failed to mark as read');
  return res.json();
}
