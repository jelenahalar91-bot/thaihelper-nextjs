/**
 * Client-side API functions for messaging.
 */

/**
 * Fetch the conversation list. Pass `role` to disambiguate when the
 * caller knows which side the user is on (the dashboard does); leave
 * empty to let the server fall back to its preference order.
 *
 * Without the hint, a stale helper cookie left over from a test
 * helper account could hijack the employer-dashboard's conversation
 * list (and vice versa).
 */
export async function fetchConversations(role) {
  const url = role ? `/api/conversations?role=${encodeURIComponent(role)}` : '/api/conversations';
  const res = await fetch(url);
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

  if (res.status === 402) {
    const err = new Error('payment_required');
    err.code = 'payment_required';
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || 'Failed to send message');
    err.code = body.error;
    err.max = body.max;
    throw err;
  }

  // Returns { message, translationFailed }
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

/**
 * Start a new conversation as a helper with a given employer.
 * Returns { conversation_id, existed }.
 */
export async function startConversationAsHelper(employerRef) {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employer_ref: employerRef }),
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

/**
 * Delete a conversation and all its messages.
 */
export async function deleteConversation(conversationId) {
  const res = await fetch(`/api/conversations?conversation_id=${conversationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to delete conversation');
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
