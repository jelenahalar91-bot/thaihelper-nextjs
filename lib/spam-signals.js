// Spam detection for messaging — volume of CONTACT-SHARING, not content.
//
// Sharing a phone number or LINE ID in chat is explicitly allowed and is the
// point of a direct-connection platform (see the note in pages/api/messages.js).
// What is never legitimate is pushing the same handoff at a large number of
// different people: that is the signature of an off-platform recruitment scam,
// not of a family hiring a nanny.
//
// So we don't look at whether a message contains contact info — we look at how
// many DISTINCT conversations this sender has dropped contact info into within
// a rolling window. Measured against real traffic on 2026-09-09:
//
//     111 conversations  EMP-B4MUCP   (confirmed scam, suspended)
//      27 conversations  EMP-BXMD0E   (legitimate couple recruiting in Pai,
//                                      phone number inside their job ad)
//      ≤5 conversations  all 67 other senders who ever shared contact info
//
// Hence: alert well below the legitimate broadcaster so a human looks once,
// and only hard-block far above them, where no honest pattern has ever landed.

import { findContactInfo } from './messaging-filter';

export const CONTACT_SPREAD_WINDOW_DAYS = 30;
// Flag for manual review — a legitimate broadcast recruiter can reach this.
export const CONTACT_SPREAD_ALERT = 12;
// Refuse to send — 48% above the highest legitimate sender ever observed.
export const CONTACT_SPREAD_BLOCK = 40;

// Bound the scan: a spammer's history is the only thing that gets long, and
// 500 recent messages is far past either threshold.
const SCAN_LIMIT = 500;

/**
 * Count distinct conversations this sender has put contact info into during
 * the window. Returns 0 without querying when `content` is clean, so ordinary
 * messages (the overwhelming majority) add no latency to the send path.
 *
 * @returns {Promise<number>} distinct conversations, including the current one
 */
export async function contactSpread(supabase, senderRef, content, conversationId) {
  if (!findContactInfo(content).length) return 0;

  const since = new Date(
    Date.now() - CONTACT_SPREAD_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id, content_original')
    .eq('sender_ref', senderRef)
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(SCAN_LIMIT);

  // Fail open — a DB hiccup must not stop people from messaging.
  if (error) {
    console.error('[spam-signals] contactSpread query failed:', error.message);
    return 0;
  }

  const convs = new Set([conversationId]); // the message being sent right now
  for (const row of data || []) {
    if (findContactInfo(row.content_original || '').length) {
      convs.add(row.conversation_id);
    }
  }
  return convs.size;
}

// ─── Outreach volume ────────────────────────────────────────────────────
//
// contactSpread above only fires once a handoff is actually in a message.
// EMP-B4MUCP sent 110 messages containing no contact info at all ("are you
// available to work for us?") before any link appeared — a scammer who builds
// rapport first, or who moves people to LINE by voice note, never trips it.
// So we also bound how many NEW conversations one account can open.
//
// Measured over all 1257 conversations on 2026-09-09, max per account:
//
//                        24 hours   30 days
//   EMP-BXMD0E (legit)         28        33   ← highest legitimate
//   EMP-B4MUCP (scam)          25       133
//   p99 of everyone else       15        21
//
// Note the daily figures: the scam account's busiest day was BELOW the
// busiest legitimate day. A daily cap cannot tell them apart, so the 30-day
// window is the real control and the daily one is only a burst brake for a
// scripted flood. Thresholds sit above every legitimate account observed.
export const OUTREACH_WINDOW_DAYS = 30;
export const OUTREACH_ALERT = 30; // a busy legitimate recruiter can reach this
export const OUTREACH_BLOCK = 60; // 82% above the highest legitimate account
// Unverified accounts get a tighter ceiling. p99 of all accounts is 21 per 30
// days, so this is invisible to ~99% of families; the rare heavy recruiter who
// hits it is asked to verify a phone number rather than turned away. That is
// the point: volume is cheap, a real phone number is not, which is what makes
// it expensive to run an account like EMP-B4MUCP.
export const OUTREACH_UNVERIFIED_BLOCK = 25;

/**
 * The tighter unverified cap only applies once people can actually verify.
 * With no Twilio credentials configured there is no way to lift it, so a
 * legitimate heavy recruiter would be blocked with no path out — the highest
 * honest account on record opened 33 conversations in 30 days, well past the
 * unverified cap. Keying this on the credentials makes the tier switch itself
 * on the moment SMS starts working, and stay off until then.
 */
export function outreachCapFor(phoneVerified) {
  if (phoneVerified) return OUTREACH_BLOCK;
  if (!process.env.TWILIO_ACCOUNT_SID) return OUTREACH_BLOCK;
  return OUTREACH_UNVERIFIED_BLOCK;
}
export const OUTREACH_DAILY_BLOCK = 40; // 43% above the busiest legitimate day

/**
 * Mail the admin inbox about a spam signal. Same destination as
 * /api/report-content — moderation is manual and mail-driven for now.
 * Never throws: a failed alert must not fail the user's request.
 */
export async function notifyAdminOfSpamSignal({ subject, lines }) {
  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) return;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'ThaiHelper <noreply@thaihelper.app>',
      to: process.env.ADMIN_EMAIL,
      subject,
      text: lines.join('\n'),
    });
  } catch (err) {
    console.error('[spam-signals] admin alert failed:', err.message);
  }
}

// ─── REGISTRATION RESEMBLANCE ───────────────────────────────────────────────
//
// The admin already gets a mail for every new family (sendAdminNotification).
// On 2026-09-15 Jelena spotted the fourth incarnation of one scam family in
// that mail by eye, and had to ask for the comparison by hand. This puts the
// comparison in the mail.
//
// It does NOT block, score, or suspend. It attaches what a human would want to
// know before deciding — because the thing that actually caught this account
// was a person reading the mail, and the goal is to make that reading faster.
//
// WHAT IS DELIBERATELY NOT HERE — measured on real traffic, 2026-09-15:
//
//   Signup speed. 75 of 147 verified accounts confirm their email in under
//   30 seconds. Not a signal, it just means the inbox was open.
//
//   Opening many conversations fast. The busiest first 20 minutes on record
//   belongs to Grant Rieger (14 conversations), a legitimate family — ahead
//   of Elizabeth Borough (13) and both later scam accounts (11 each). A
//   threshold that catches the scam catches honest new families first. This
//   is why there is no burst rule anywhere in this file.
//
//   City/area mismatch. "Hua Takhe Market" under Bangkok and "Prachuap Khiri
//   Khan" under Hua Hin are correct sub-districts, not contradictions.
//
//   Registering shortly after a suspension. This one looked compelling —
//   Meredith came 31h after Elizabeth was stopped, Helen 14 minutes after
//   Anita. A point-in-time replay over all 164 registrations killed it: a 48h
//   window flags 11 accounts on timing alone and every one is a real family,
//   while both scam accounts it would have caught were already caught by the
//   rule below. It adds noise and nothing else.
//
// What is left is one rule, and it is an observation about a SUSPENDED
// account rather than a guess about this one.

/**
 * Notes for the admin registration mail. Empty array = nothing remarkable.
 *
 * @returns {Promise<string[]>} human-readable lines, most specific first
 */
export async function registrationResemblance(supabase, { employerRef, lookingFor, createdAt }) {
  const notes = [];
  const now = createdAt ? new Date(createdAt) : new Date();

  const { data: rows, error } = await supabase
    .from('employer_accounts')
    .select('employer_ref, first_name, last_name, looking_for, status_changed_at')
    .eq('status', 'suspended');

  // Never compare an account against itself. Can't happen on a live signup —
  // a brand-new account is not suspended — but it silently poisons any replay
  // over historical data, which is how this rule gets re-calibrated.
  const suspended = (rows || []).filter((s) => s.employer_ref !== employerRef);

  // Never let this break a signup: the mail is a courtesy, the account is real.
  if (error) return notes;

  // The same combination of roles as an account we stopped. Measured over all
  // 164 registrations, judged only against what was already suspended at the
  // time: 2 hits, both scam accounts, no false positive ever. It would have
  // flagged Meredith Francis a full day before a helper reported her.
  //
  // Exact-match on purpose — a looser rule would hit the 25 accounts that
  // simply want a nanny. And it is a cheap trap, not a defence: the day this
  // family ticks different boxes it stops working, and that is fine. It costs
  // one query and has never once cried wolf.
  const wanted = (lookingFor || '').trim().toLowerCase();
  if (wanted) {
    const twins = suspended.filter(
      (s) => (s.looking_for || '').trim().toLowerCase() === wanted
    );
    if (twins.length) {
      notes.push(
        `Wants exactly what ${twins.length === 1 ? 'a suspended account' : `${twins.length} suspended accounts`} wanted: `
        + twins.map((s) => `${s.first_name} ${s.last_name} (${s.employer_ref})`).join(', ')
      );
    }
  }

  // When something did match, say how fresh the precedent is — not as a rule
  // of its own (see the note above on why the timing window was dropped) but
  // as context for the one line that did fire.
  if (notes.length) {
    const last = suspended
      .filter((s) => s.status_changed_at)
      .map((s) => ({ ...s, hours: (now - new Date(s.status_changed_at)) / 36e5 }))
      .filter((s) => s.hours >= 0)
      .sort((a, b) => a.hours - b.hours)[0];
    if (last && last.hours <= 48) {
      notes.push(
        `For context: ${last.first_name} ${last.last_name} (${last.employer_ref}) was suspended `
        + `${last.hours < 1 ? `${Math.round(last.hours * 60)} minutes` : `${Math.round(last.hours)} hours`} ago.`
      );
    }
  }

  return notes;
}
