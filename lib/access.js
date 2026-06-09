/**
 * Access utilities.
 *
 * 2026-06-09 — paywall removed. ThaiHelper is now positioned as a
 * direct-connection platform (not a marketplace that gates messaging
 * behind payment). Messaging is FREE for everyone whose email is
 * verified. The only gate is email verification.
 *
 * The access_tier and access_until columns are kept in the schema
 * for historical / analytics purposes but are no longer consulted
 * for any access decision. If a paid tier ever returns (e.g. for a
 * business / cleaning-company tier), the gate should live in a
 * NEW helper, not by re-enabling the legacy access_until check —
 * which leaves families confused about why their access "expired".
 *
 * Active access ⇔  employer.email_verified === true.
 */

export function hasActiveAccess(employer) {
  if (!employer) return false;
  return employer.email_verified === true;
}

/**
 * Legacy helper kept for backward-compatibility with callers that
 * still expect a days-remaining value. Always returns null now —
 * access doesn't expire.
 */
export function accessDaysRemaining(_employer) {
  return null;
}

/**
 * Returns a serializable access status object safe to send to the client.
 * The 'tier' field is always 'free' since there's no paid tier any more.
 */
export function getAccessStatus(employer) {
  return {
    active: hasActiveAccess(employer),
    tier: 'free',
    daysRemaining: null,
    expiresAt: null,
  };
}

/**
 * Build a preview of a message for free-tier employers.
 *
 * Returns only the first N words of a message's content — the UI then blurs
 * the rest and shows an "Upgrade to read" CTA. We do this server-side so the
 * full content never reaches the client for locked messages (can't inspect
 * it in DevTools).
 *
 * @param {string} content      — the full message text
 * @param {number} maxWords     — how many words to reveal (default 3)
 * @returns {{ preview: string, fullLength: number, isLocked: true }}
 */
export function buildMessagePreview(content, maxWords = 3) {
  const text = (content || '').trim();
  if (!text) {
    return { preview: '', fullLength: 0, isLocked: true };
  }
  const words = text.split(/\s+/);
  const preview = words.slice(0, maxWords).join(' ');
  return {
    preview: words.length > maxWords ? preview + '…' : preview,
    fullLength: text.length,
    isLocked: true,
  };
}

/**
 * Mask a message object for the client based on access.
 * If the employer has active access, returns the full content.
 * Otherwise returns only a truncated preview.
 *
 * The helper ALWAYS sees full messages — only the employer side is gated.
 */
export function maskMessageForEmployer(message, employerHasAccess) {
  if (employerHasAccess) {
    return {
      ...message,
      is_locked: false,
    };
  }
  // Prefer the translated content for the preview (employer's language)
  const source = message.content_translated || message.content_original || '';
  const { preview, fullLength } = buildMessagePreview(source, 3);
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_type: message.sender_type,
    sender_ref: message.sender_ref,
    created_at: message.created_at,
    is_read: message.is_read,
    // Locked payload — never include the full text
    content_preview: preview,
    content_full_length: fullLength,
    is_locked: true,
  };
}
