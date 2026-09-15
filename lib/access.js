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
 * Families registering from this date onwards must verify a phone before they
 * can message anyone — no grace period. Set PHONE_MANDATORY_FROM to an ISO
 * date to switch it on; unset means nobody is required.
 *
 * NEW ACCOUNTS GET NO GRACE PERIOD ON PURPOSE. A deadline is the right shape
 * for the people already here, who need time to notice an email. It is exactly
 * the wrong shape for the account that registered ten minutes ago: EMP-PO73IS
 * opened 11 conversations in 14 minutes, and EMP-P2PQTJ appeared 15 minutes
 * after it was suspended. A fortnight of free rein is what they want.
 *
 * Gated on Twilio being configured, for the same reason outreachCapFor() is
 * (lib/spam-signals.js): a requirement nobody can satisfy is a locked door, not
 * a check. Until SMS actually works this returns false for everyone.
 */
export function phoneRequired(employer) {
  // Nothing applies until SMS actually works — same reasoning as
  // outreachCapFor(): a requirement nobody can satisfy is a locked door.
  if (!process.env.TWILIO_ACCOUNT_SID) return false;
  // No created_at selected means we cannot tell, and guessing "required" would
  // lock out an account over a missing column. Callers must select it — see
  // the note on hasActiveAccess below.
  if (!employer?.created_at) return false;

  // Accounts that registered after the cutover: required immediately.
  const from = process.env.PHONE_MANDATORY_FROM;
  if (from && new Date(employer.created_at) >= new Date(from)) return true;

  // Accounts that were already here: required once the date we announced by
  // email has passed. PHONE_DEADLINE_AT must be the exact date the letter
  // named (scripts/send-phone-verification-blast.js --deadline), or people are
  // shut out on a day nobody told them about.
  const deadline = process.env.PHONE_DEADLINE_AT;
  if (deadline && Date.now() >= new Date(deadline).getTime()) return true;

  return false;
}

/**
 * Should this family be hidden from the public listing?
 *
 * Computed live rather than written into search_status by a nightly job, and
 * that is the important part: the moment they verify, they are back — no cron
 * run to wait for, no state to repair if the job fails or runs twice. Hiding
 * and un-hiding are the same expression evaluated at read time.
 */
export function hiddenForMissingPhone(employer) {
  return phoneRequired(employer) && !employer?.phone_verified_at;
}

/**
 * Why this family cannot message, or null when it can.
 *
 * Exists so the API can say WHICH door is shut. Both endpoints used to answer
 * every denial with 'email_not_verified', which was true when email was the
 * only gate — now it would tell someone with a confirmed email to go confirm
 * their email, and leave them with no way to work out what to do.
 *
 * @returns {null|'account_suspended'|'email_not_verified'|'phone_not_verified'}
 */
export function accessDenialReason(employer) {
  if (!employer) return 'email_not_verified';
  if (employer.status === 'suspended') return 'account_suspended';
  if (employer.email_verified !== true) return 'email_not_verified';
  if (phoneRequired(employer) && !employer.phone_verified_at) return 'phone_not_verified';
  return null;
}

/**
 * Callers MUST select `status`, `email_verified`, `created_at` and
 * `phone_verified_at`. A column that is not selected reads as undefined and
 * fails open — which is the safe direction for a person, but means a gate you
 * think is on is quietly off.
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
