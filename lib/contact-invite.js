// Did the helper open the door before the family walked through it?
//
// pages/api/messages.js mails the admin inbox every time an EMPLOYER sends a
// tap-to-open contact link, because across 30 days of traffic (measured
// 2026-09-15) every single one came from a confirmed scam account. That is
// still true of links a family sends UNPROMPTED. It is not true of the other
// half of the traffic, which the alert has always had to be read by hand:
//
//   2026-10-26  EMP-HS6UKE  answered a helper who wrote "How can I apply?"
//   2026-11-19  EMP-XG6SYL  answered "Please ad friend On line Application /
//                           By my phone number 0843784457" — then, when he
//                           could not find her by that number, sent his own
//                           line.me link so she could add him instead
//
// Both were ordinary hiring. Exchanging numbers has been allowed since
// 2026-06-08 and is the point of a direct-connection platform; a helper who
// asks for the handle and gets it is the platform working, not a scam.
//
// So the mail is suppressed when the helper asked first AND this account has
// not sent a link to anybody else (see linkSpread below). The cost of being
// wrong here is a missed alert, which is why the test is the helper's own
// words in the same conversation and nothing softer: not the family's claim
// that she asked, not a guess from the shape of the thread.
//
// Judge this file by scripts/calibrate-contact-link-alert.js, which replays
// it over every employer link ever sent. Read that output before editing a
// regex — the same rule as lib/spam-signals.js.

import { extractHandles, linkHandles } from './contact-blocklist.js';

// An invitation excuses ONE answer, not a campaign. Replaying this rule over
// the whole corpus (scripts/calibrate-contact-link-alert.js) showed why that
// second half is not optional: 15 of EMP-B4MUCP's and EMP-3THHAA's link
// messages — both confirmed scams — landed in conversations where the helper
// had just offered her own number or asked for WhatsApp. Answering her is
// what the scam looks like from inside a single thread. What it never
// survives is being counted across threads: those two accounts pushed the
// same handle into 83 and 6 other conversations.
//
// So a helper's invitation only silences the alert while this account has
// sent no link to anybody else. The first one can slip through; the second
// cannot, and nothing that sprays ever stays quiet.
const LINK_SPREAD_WINDOW_DAYS = 30;
// Same bound as contactSpread() in lib/spam-signals.js, and far past the one
// link that matters here.
const SCAN_LIMIT = 500;

/**
 * How many OTHER conversations this sender has put a tap-to-open link into.
 *
 * @returns {Promise<number>} distinct conversations, excluding this one
 */
export async function linkSpread(supabase, senderRef, conversationId) {
  const since = new Date(
    Date.now() - LINK_SPREAD_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id, content_original')
    .eq('sender_ref', senderRef)
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(SCAN_LIMIT);

  // Fail LOUD, unlike contactSpread: that one fails open so a database hiccup
  // cannot stop somebody messaging. This one decides whether an alert is
  // silenced, so a hiccup has to mean "alert anyway".
  if (error) {
    console.error('[contact-invite] linkSpread query failed:', error.message);
    return Infinity;
  }

  const convs = new Set();
  for (const row of data || []) {
    if (row.conversation_id === conversationId) continue;
    if (linkHandles(row.content_original || '').length) convs.add(row.conversation_id);
  }
  return convs.size;
}

// LINE, WhatsApp and the rest, named by a helper in her own message. Naming
// the channel IS the invitation in this corpus: nobody writes "line" at a
// stranger except to move the conversation there. \bline\b deliberately does
// not match "online" — but it does match "On line Application", which is how
// it is spelled when the typing is slow and the English is a second language.
const MESSENGER_RE = /\b(?:line|whats\s?app|telegram|viber|we\s?chat|messenger|signal|imo|zalo)\b/i;

// "you can call me", "please contact me", "text us", "add me", "ad friend".
// The missing letter is not a typo to be tolerated so much as the normal
// spelling here — "ad friend" appears in real messages more than once.
const REACH_ME_RE = /\b(?:call|contact|text|message|reach|add)\s+(?:me|us|my)\b|\b(?:add|ad)\s+friend\b/i;

// The sentence the alert's own text names as the ordinary exception.
const HOW_TO_APPLY_RE = /\bhow\s+(?:can|do|should|to)\s+(?:i|we|my)?\s*apply\b|\bhow\s+to\s+apply\b|\bi\s+(?:want|would like)\s+to\s+apply\b/i;

/**
 * Whether one helper message invites contact off the thread.
 *
 * @param {string} text
 * @returns {string|null} a short reason, or null
 */
export function invitesContact(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  if (extractHandles(text).length) return 'shared her own contact details';
  if (MESSENGER_RE.test(text)) return 'named a messenger app';
  if (REACH_ME_RE.test(text)) return 'asked to be contacted';
  if (HOW_TO_APPLY_RE.test(text)) return 'asked how to apply';
  return null;
}

/**
 * The first helper message in a conversation that opened the door, if any.
 *
 * Thai and Burmese arrive translated, so both spellings are read: the English
 * is usually the only one a regex written in English can see.
 *
 * @param {Array<{sender_type: string, content_original: string, content_translated?: string}>} messages
 *        oldest first; must contain only messages sent BEFORE the link
 * @returns {{reason: string, text: string}|null}
 */
export function helperOpenedTheDoor(messages) {
  for (const m of messages || []) {
    if (m.sender_type !== 'helper') continue;
    for (const text of [m.content_original, m.content_translated]) {
      const reason = invitesContact(text);
      if (reason) return { reason, text: String(text).trim() };
    }
  }
  return null;
}
