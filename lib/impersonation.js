/**
 * Names nobody may register under.
 *
 * On 2026-09-27 someone signed up as "Support ThaiHelper", passed email AND
 * phone verification, and sent nine helpers a message saying their account had
 * been suspended and they should confirm it through a link. Seven opened it.
 * The whole attack rested on one thing: the sender name looked like us.
 *
 * Everything else about that account was ordinary, so no volume or content rule
 * could have caught it early — he sent ten messages and stopped, well under the
 * outreach alert at 30. The name was the only part that was a lie from the
 * first second, and it was never checked.
 *
 * Two tiers on purpose:
 *
 *   block()  — the name IS a role word ("Support", "Admin"), or contains our
 *              own brand. Refused at signup. Narrow by design: matched against
 *              the whole trimmed field, so "Support" is refused and "Supporter"
 *              is not, and a real person keeps their name.
 *
 *   flag()   — the name merely CONTAINS a role word ("Nina Support Team").
 *              Never refused, only listed in the admin mail next to the other
 *              resemblance notes. A wrong guess here costs one line in an email
 *              nobody else reads; a wrong block costs a real helper her signup.
 *
 * Deliberately NOT applied to company names (/api/partner-signup). A cleaning
 * company is perfectly entitled to be called "Bangkok Home Service", and the
 * directory listings are admin-approved before they go live anyway.
 */

// Words that are a job or a role on this platform, not a person's name.
const RESERVED = [
  'support', 'admin', 'administrator', 'moderator', 'mod',
  'verification', 'verify', 'verified', 'security',
  'official', 'team', 'staff', 'service', 'helpdesk', 'help desk', 'help',
  'notification', 'notifications', 'noreply', 'no-reply', 'no reply',
  'customer service', 'customer care', 'customer support',
  'account', 'accounts', 'billing', 'payment', 'payments',
  'system', 'info', 'contact',
];

// Our own name, in the spellings an impersonator would reach for. Nobody is
// called this, so it is refused wherever it appears in a name field.
const BRAND = ['thaihelper', 'thai helper', 'thai-helper'];

// Strip case, punctuation and repeated spaces so "S.U.P.P.O.R.T" and
// "  Support  " both land on "support".
function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Should this registration be refused?
 *
 * @param {object} name  { firstName, lastName }
 * @returns {null|{field: 'firstName'|'lastName', reason: 'brand'|'reserved', value: string}}
 */
export function impersonationBlock({ firstName, lastName } = {}) {
  for (const [field, raw] of [['firstName', firstName], ['lastName', lastName]]) {
    const n = normalise(raw);
    if (!n) continue;

    // Our brand anywhere in the field — including "Support ThaiHelper", which
    // is the exact string that started this.
    if (BRAND.some((b) => n.includes(b))) {
      return { field, reason: 'brand', value: String(raw).trim() };
    }

    // The field IS a role word. Whole-field match only.
    if (RESERVED.includes(n)) {
      return { field, reason: 'reserved', value: String(raw).trim() };
    }
  }
  return null;
}

/**
 * Softer signal for the admin mail. Returns human-readable notes, never blocks.
 * Skips anything impersonationBlock() already refuses, so the mail does not
 * repeat what the signup already stopped.
 *
 * @returns {string[]}
 */
export function impersonationNotes({ firstName, lastName } = {}) {
  if (impersonationBlock({ firstName, lastName })) return [];
  const notes = [];
  for (const [label, raw] of [['First name', firstName], ['Last name', lastName]]) {
    const n = normalise(raw);
    if (!n) continue;
    const words = new Set(n.split(' '));
    const hit = RESERVED.filter((r) => !r.includes(' ') && words.has(r));
    if (hit.length) {
      notes.push(`${label} "${String(raw).trim()}" contains a role word (${hit.join(', ')}) — check it is a person`);
    }
  }
  return notes;
}

/** Error code returned to the signup forms. */
export const IMPERSONATION_ERROR = 'name_not_allowed';
