// Who may rate whom.
//
// Extracted from pages/api/ratings.js so the hire-confirmation mail can ask
// the same question before it invites a family to rate someone. Asking and
// then refusing was worse than not asking: on 2026-09-28 three of nine
// confirmed hires turned out to be helpers misreading the button, and the
// families behind them got an invitation to a rating box that never appeared.

// What has to have happened before a family may review a helper.
//
// Until 2026-09-12 one message from each side was enough. EMP-572KZV messaged
// a helper, she replied, and that made him eligible to publish "she is a
// scammer, I caught her stealing money from my daughters money box". Two
// messages is not a working relationship; it is an introduction.
//
// Calibrated against the message corpus rather than picked by feel (the same
// rule as the spam thresholds): of 1,330 conversations, 337 clear the old
// 1+1 bar, 120 clear 3+3, and 66 clear 3+3 spread over a day. Tightening to
// 3+3/24h therefore removes ~80% of the drive-by surface — and costs close to
// nothing in real reviews, because in 3.5 months exactly 3 reviews were ever
// written, 2 of them by this one man.
//
// Neither number can prove a job happened; nothing in the schema can, since
// hiring occurs off-platform. They raise the price of a drive-by accusation
// from four clicks to a sustained exchange, which is what the abuse case
// actually needed.
const MIN_MESSAGES_PER_SIDE = 3;

// Time that must pass before a review may be written — measured from the
// FIRST message, not across the conversation.
//
// Until 2026-09-16 this was a span: last message minus first message had to
// be at least a day. That rule punished the ordinary way hiring happens here.
// The clearest case is in our own data: EMP-G3DER8 and TH-WAQMT7 talked for
// 59 minutes, swapped WhatsApp numbers, and the helper came to work. A real
// job, a real reference — and under the span rule that family could never
// have said so. It is not rare either: of 130 pairs with a genuine
// back-and-forth, 54 fail on span alone, which is 17 families who can review
// nobody.
//
// Dropping the wait entirely was not an option. EMP-572KZV, the revenge
// review that started all of this, had four messages from each side — the
// message count never stopped him. Thirteen hours of conversation did.
//
// Measuring from first contact keeps exactly that: he still has to come back
// a day later to publish. What it stops doing is demanding that the
// conversation itself be slow, which was never evidence of anything. The
// honest limit: neither shape stops someone patient, who under the old rule
// only had to send one more message the next day. What protects a helper
// after publication is the dispute link and the 1-2 star admin alert.
const MIN_AGE_SINCE_FIRST_CONTACT_MS = 24 * 60 * 60 * 1000;

// Returns { canRate: boolean, reason: string|null } describing whether
// `employer_ref` is allowed to rate `helper_ref`. Reason codes:
//   'not_messaged'      — no conversation, or only one side has spoken
//   'too_few_messages'  — talked, but not enough either way
//   'too_recent'        — they only started talking today
//   null                — eligible
export async function checkEligibility(supabase, employer_ref, helper_ref) {
  // Deliberately counts conversations either side has hidden
  // (lib/conversation-visibility.js). Eligibility is about whether the two
  // actually talked, and that stays true once it happened — if hiding a
  // thread revoked it, a helper could drop an honest review by deleting the
  // conversation behind it, and a family could strip their own review of the
  // evidence backing it.
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .eq('helper_ref', helper_ref)
    .eq('employer_id', employer_ref);

  if (!convs || convs.length === 0) {
    return { canRate: false, reason: 'not_messaged' };
  }

  const convIds = convs.map(c => c.id);

  const { data: msgs } = await supabase
    .from('messages')
    .select('sender_type, created_at')
    .in('conversation_id', convIds);

  const rows = msgs || [];
  const fromEmployer = rows.filter(m => m.sender_type === 'employer').length;
  const fromHelper = rows.filter(m => m.sender_type === 'helper').length;

  if (fromEmployer === 0 || fromHelper === 0) {
    return { canRate: false, reason: 'not_messaged' };
  }
  if (fromEmployer < MIN_MESSAGES_PER_SIDE || fromHelper < MIN_MESSAGES_PER_SIDE) {
    return { canRate: false, reason: 'too_few_messages' };
  }

  const times = rows.map(m => new Date(m.created_at).getTime()).filter(t => !Number.isNaN(t));
  const firstContact = times.length ? Math.min(...times) : Date.now();
  if (Date.now() - firstContact < MIN_AGE_SINCE_FIRST_CONTACT_MS) {
    return { canRate: false, reason: 'too_recent' };
  }

  return { canRate: true, reason: null };
}
