/**
 * Paywall / access utilities.
 *
 * Single source of truth for "does this employer have contact-info access?"
 * Used by:
 *  - /api/helpers/[ref]/contact  (gate around WhatsApp / phone / email)
 *  - /api/employer-profile        (returned as a flag to the client)
 *  - any future paid feature
 *
 * Access model:
 *  - access_tier: 'free' | 'promo' | 'paid'
 *  - access_until: TIMESTAMPTZ  (NULL = no access, future date = active)
 *  - has active access ⇔  access_until IS NOT NULL AND access_until > now()
 */

export function hasActiveAccess(employer) {
  if (!employer) return false;
  const until = employer.access_until;
  if (!until) return false;
  const expiry = new Date(until).getTime();
  if (Number.isNaN(expiry)) return false;
  return expiry > Date.now();
}

/**
 * Returns the number of days remaining on the employer's access, or null
 * if they have no active access.
 */
export function accessDaysRemaining(employer) {
  if (!hasActiveAccess(employer)) return null;
  const expiry = new Date(employer.access_until).getTime();
  const ms = expiry - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Returns a serializable access status object safe to send to the client.
 * Never leak anything beyond these fields.
 */
export function getAccessStatus(employer) {
  const active = hasActiveAccess(employer);
  return {
    active,
    tier: employer?.access_tier || 'free',
    daysRemaining: active ? accessDaysRemaining(employer) : 0,
    expiresAt: active ? employer.access_until : null,
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
