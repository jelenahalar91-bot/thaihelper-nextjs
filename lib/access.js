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
 * Active access ⇔  employer.email_verified === true
 *                   AND the account has not been suspended by staff.
 *
 * 2026-09-09 — `status` added (scripts/supabase-account-status.sql). Before
 * it, suspending an account meant improvising with email_verified + a
 * sentinel email address, which destroyed the real address and could not
 * record a reason. Callers MUST select `status` alongside `email_verified`;
 * a missing column would read as undefined and silently grant access, so
 * only an explicit 'suspended' denies — no other value is treated as a block.
 */

/**
 * Does starting a NEW conversation need a verified phone?
 *
 * ONE RULE, APPLIED AT THE MOMENT THAT MATTERS. Not a deadline, not a date
 * that splits the userbase, and nothing that expires. Approaching a helper you
 * have never spoken to is the act every scam on this platform consists of;
 * that act needs a number. Replying in a conversation you already have does
 * not, and nothing is ever hidden or deleted.
 *
 * WHAT THIS REPLACED, AND WHY. First version keyed off the registration date:
 * accounts created after PHONE_MANDATORY_FROM were required, everyone else was
 * exempt until an announced cutoff hid their profile. Two problems. The
 * requirement tracked *when somebody signed up* rather than *what they are
 * doing* — a family from before the cutover could open 25 new conversations
 * without ever verifying. And hiding a profile is a real loss, which is what
 * made an announcement period necessary in the first place.
 *
 * Being asked to verify before a new conversation costs nobody anything except
 * two minutes, at the exact moment they have a reason to care. So there is no
 * lead time and no grandfathering: it simply applies.
 *
 * Inert until Twilio is configured — a requirement nobody can satisfy is a
 * locked door, not a check (same reasoning as outreachCapFor()).
 */
export function outreachNeedsPhone() {
  return !!process.env.TWILIO_ACCOUNT_SID
    && process.env.PHONE_REQUIRED_FOR_OUTREACH === 'true';
}

/**
 * May this family start a conversation with somebody new?
 *
 * Deliberately separate from hasActiveAccess(): that one governs whether the
 * account works at all, this one governs one action. Keeping them apart is
 * what lets an unverified family carry on talking to the people it is already
 * talking to.
 *
 * Callers MUST select `phone_verified_at` alongside the access columns.
 */
export function canStartConversation(employer) {
  if (!hasActiveAccess(employer)) return false;
  if (!outreachNeedsPhone()) return true;
  return !!employer?.phone_verified_at;
}

/**
 * Why this family cannot message, or null when it can.
 *
 * Exists so the API can say WHICH door is shut. Both endpoints used to answer
 * every denial with 'email_not_verified', which was true when email was the
 * only gate — now it would tell someone with a confirmed email to go confirm
 * their email, and leave them with no way to work out what to do.
 *
 * @returns {null|'account_suspended'|'email_not_verified'}
 */
export function accessDenialReason(employer) {
  if (!employer) return 'email_not_verified';
  if (employer.status === 'suspended') return 'account_suspended';
  if (employer.email_verified !== true) return 'email_not_verified';
  // Deliberately NOT a phone check. Access means "this account works";
  // verifying a phone gates one action, and canStartConversation() is where
  // that lives. Putting it here would cut off replies in conversations the
  // family already has, which is the thing we promised not to do.
  return null;
}

/**
 * Callers MUST select `status` and `email_verified`. A column that is not
 * selected reads as undefined and fails open — which is the safe direction for
 * a person, but means a gate you think is on is quietly off.
 */
export function hasActiveAccess(employer) {
  return accessDenialReason(employer) === null;
}

/** True when staff have stopped this account. Works for helpers too. */
export function isSuspended(account) {
  return account?.status === 'suspended';
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
