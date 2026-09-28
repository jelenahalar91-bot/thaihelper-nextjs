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
import { countRateLimit, recordRateLimit } from './rate-limit';

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

/**
 * The moderation command to print in an alert mail.
 *
 * Every alert used to end in `scripts/suspend-employer.js <ref>`, including the
 * ones about helpers — and that script refuses anything that is not an EMP-
 * ref, so a helper alert ended in a command that exits with a usage error. The
 * tool takes both sides now; this is the one place that names it.
 */
export function suspendCommand(ref) {
  return `node scripts/suspend-account.js ${ref} --dry-run`;
}

// ─── Outreach volume ────────────────────────────────────────────────────
//
// contactSpread above only fires once a handoff is actually in a message.
// EMP-B4MUCP sent 110 messages containing no contact info at all ("are you
// available to work for us?") before any link appeared — a scammer who builds
// rapport first, or who moves people to LINE by voice note, never trips it.
// So we also bound how many NEW people one account may approach.
//
// WHAT COUNTS AS OUTREACH — redefined 2026-09-28.
//
// This used to count conversation ROWS: one event per request that created a
// conversation. 551 of the 1769 conversations ever created (31%) never carried
// a single message. Opening a chat and not writing is an ordinary thing to do
// from a profile page, and it reaches nobody — an empty thread is filtered out
// of both inboxes. Counting those made the number mean something other than
// what the alert mail claimed it meant: TH-BKBNIB tripped the alert at 31 on
// 2026-09-27 having actually written to 16 families, every message one of our
// own quick-reply buttons.
//
// An outreach event is now the FIRST MESSAGE in a conversation — you spoke to
// somebody who had not spoken to you. Replies never count, empty threads never
// count, and the figure in the alert is the number of people really approached.
//
// Busiest 30-day window per account under that definition, whole corpus:
//
//                         helpers   families
//   median                      3          3
//   p90                         9         13
//   highest honest             17         27   (TH-TF8R3D, EMP-BXMD0E)
//   confirmed scam              —        122   (EMP-B4MUCP)
//
// Helpers are now the majority of senders here — 113 have approached a family,
// against 100 families who approached a helper — and what they are doing is
// applying for jobs. The thresholds below still sit above every honest account
// on either side, but the gap on the helper side is much larger, which is why
// the alert mail says what normal looks like for the role it is talking about.
export const OUTREACH_WINDOW_DAYS = 30;
export const OUTREACH_ALERT = 30; // 11% above the highest honest account
export const OUTREACH_BLOCK = 60; // 122% above it, half the confirmed scam
// The busiest honest account on each side, for the alert mail. A number 30 is
// remarkable for is not the same number on both sides of the platform.
export const OUTREACH_HONEST_MAX = { helper: 17, employer: 27 };
// Unverified accounts get a tighter ceiling. p90 of all accounts is 13 per 30
// days, so this is invisible to ~95% of families; the rare heavy recruiter who
// hits it is asked to verify a phone number rather than turned away. That is
// the point: volume is cheap, a real phone number is not, which is what makes
// it expensive to run an account like EMP-B4MUCP.
export const OUTREACH_UNVERIFIED_BLOCK = 25;

/**
 * The tighter unverified cap only applies once people can actually verify.
 * With no Twilio credentials configured there is no way to lift it, so a
 * legitimate heavy recruiter would be blocked with no path out — the highest
 * honest account on record approached 27 people in 30 days, past the
 * unverified cap. Keying this on the credentials makes the tier switch itself
 * on the moment SMS starts working, and stay off until then.
 */
export function outreachCapFor(phoneVerified) {
  if (phoneVerified) return OUTREACH_BLOCK;
  if (!process.env.TWILIO_ACCOUNT_SID) return OUTREACH_BLOCK;
  return OUTREACH_UNVERIFIED_BLOCK;
}
export const OUTREACH_DAILY_BLOCK = 40; // 54% above the busiest honest day (26)

// New bucket name on purpose. The rows in 'conversation-start' were written at
// conversation creation and mean something else — mixing them in would keep
// counting empty threads for another 30 days. They age out on their own.
const OUTREACH_BUCKET = 'outreach-sent';
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Record one outreach event. Called after a first message is actually stored,
 * so the counter only ever holds people who were really approached.
 */
export async function recordOutreach(ref) {
  await recordRateLimit({ bucket: OUTREACH_BUCKET, key: ref });
}

function outreachAlertLines({ ref, role, inWindow, today, cap, blocked, phoneVerified }) {
  const isHelper = role === 'helper';
  const honest = OUTREACH_HONEST_MAX[isHelper ? 'helper' : 'employer'];
  return [
    `${ref} (${role}) has sent a first message to ${inWindow} different`,
    `${isHelper ? 'families' : 'helpers'} in the last ${OUTREACH_WINDOW_DAYS} days, ${today} of them in the last 24 hours.`,
    '',
    blocked
      ? `This attempt was BLOCKED (limits: ${cap} per ${OUTREACH_WINDOW_DAYS}d, ${OUTREACH_DAILY_BLOCK} per day).`
      : `Still allowed — alert threshold is ${OUTREACH_ALERT}, block is ${cap}.`,
    phoneVerified
      ? 'Phone: verified.'
      : cap === OUTREACH_BLOCK
        ? 'Phone: not verified, but SMS is not configured yet, so the full cap applies.'
        : `Phone: NOT verified — that is why the cap is ${OUTREACH_UNVERIFIED_BLOCK} rather than ${OUTREACH_BLOCK}.`,
    '',
    'Replies do not count, and neither does opening a chat without writing.',
    '',
    ...(isHelper
      ? [
          `For a helper this is high: the busiest honest helper on record`,
          `approached ${honest} families in 30 days. But a helper at this volume is`,
          `applying for jobs, and the quick-reply buttons on her dashboard make`,
          `every opening line identical by design — identical text here is our`,
          `wording, not hers. Read the conversations before reading the number.`,
        ]
      : [
          `A busy legitimate family does reach the alert threshold — the highest`,
          `honest account on record approached ${honest} helpers in 30 days.`,
        ]),
    '',
    `Check before acting: ${suspendCommand(ref)}`,
  ];
}

/**
 * May this account approach one more person?
 *
 * Asked in two places, because a conversation and its first message are two
 * separate requests: /api/conversations refuses to create the thread, and
 * /api/messages refuses the first message inside a thread that already exists.
 * Without the second check an account could open a hundred empty threads while
 * this counter sat at zero — they cost nothing now — and then write into all
 * of them unchecked.
 *
 * Alerts the admin at most once per account per day, whether or not the
 * attempt ends in a block.
 *
 * @returns {Promise<'phone'|'volume'|null>} null when the caller may proceed.
 *   'phone' when verifying a number would lift the cap right now, 'volume'
 *   when it would not (already verified, or the daily brake tripped). The
 *   caller turns that into an error code so the user is told which it is —
 *   the unverified cap exists to ask for a phone number, not to turn people
 *   away.
 */
export async function outreachGate({ ref, role, phoneVerified }) {
  const cap = outreachCapFor(phoneVerified);
  const [inWindow, today] = await Promise.all([
    countRateLimit({
      bucket: OUTREACH_BUCKET,
      key: ref,
      windowMs: OUTREACH_WINDOW_DAYS * DAY_MS,
    }),
    countRateLimit({ bucket: OUTREACH_BUCKET, key: ref, windowMs: DAY_MS }),
  ]);

  const blocked = inWindow >= cap || today >= OUTREACH_DAILY_BLOCK;

  // One alert per account per day, whether it ends in a block or not.
  if (blocked || inWindow + 1 >= OUTREACH_ALERT) {
    const fresh = await countRateLimit({
      bucket: 'outreach-alert',
      key: ref,
      windowMs: DAY_MS,
    });
    if (fresh === 0) {
      await recordRateLimit({ bucket: 'outreach-alert', key: ref });
      notifyAdminOfSpamSignal({
        subject: `\u{1F6A8} Outreach volume: ${role} ${ref} (${inWindow} in ${OUTREACH_WINDOW_DAYS}d)`,
        lines: outreachAlertLines({ ref, role, inWindow, today, cap, blocked, phoneVerified }),
      });
    }
  }

  if (blocked) {
    console.warn(`[spam] blocked outreach from ${ref}: ${inWindow} in ${OUTREACH_WINDOW_DAYS}d, ${today} today`);
    // Verifying only helps when the 30-day cap is the tighter unverified one
    // AND that is what was actually hit — not when the daily brake tripped.
    const liftable = !phoneVerified
      && cap === OUTREACH_UNVERIFIED_BLOCK
      && inWindow >= cap
      && today < OUTREACH_DAILY_BLOCK;
    return liftable ? 'phone' : 'volume';
  }

  return null;
}

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
// ─── Link shorteners ────────────────────────────────────────────────
//
// A shortener hides where a link goes, which is the whole point of using one
// in a phishing message. "Support ThaiHelper" (EMP-6J3VUE) sent ten helpers
// https://tinu.be/ThaiHelper on 2026-09-27 telling them their account was
// suspended; nothing in the platform looked at it, and the account was only
// found 21 hours later because Jelena happened to re-read the signup mail.
//
// Calibrated against the whole message corpus rather than by feel. Across
// every message ever sent, exactly 14 contain a shortener: the attacker's 10,
// and 4 maps.app.goo.gl links from families sharing their home address. So the
// rule below reports the 10 and leaves the 4 alone — no false positive on the
// record at all.
//
// Reported, never blocked. A family is entitled to send a short link, and
// blocking would teach the next attacker to spell the domain differently. The
// point is that a human sees it the same hour instead of the next day.
const SHORTENER_HOSTS = [
  'tinu.be', 'bit.ly', 't.ly', 'tinyurl.com', 'cutt.ly', 'rb.gy',
  'is.gd', 'ow.ly', 'rebrand.ly', 'shorturl.at', 'qrco.de',
  's.id', 'short.link', 'shorte.st', 'adf.ly', 'v.gd', 'buff.ly',
];

// Google Maps place links live on goo.gl and are the single most common
// legitimate short link here — families send their address that way. Never
// report those.
const SHORTENER_ALLOW = /maps\.app\.goo\.gl|goo\.gl\/maps/i;

/**
 * Shortener domains present in a message. Empty array for almost every
 * message ever sent, so calling it costs nothing.
 *
 * @param {string} content
 * @returns {string[]}
 */
export function shortenerLinks(content) {
  if (typeof content !== 'string' || !content) return [];
  const text = content.replace(SHORTENER_ALLOW, ' ');
  const found = new Set();
  for (const host of SHORTENER_HOSTS) {
    // Require a host boundary so "bit.ly" does not fire on "rabbit.lyrics".
    const re = new RegExp(`(?:^|[^a-z0-9.-])${host.replace(/\./g, '\\.')}(?:[/?#]|\\b)`, 'i');
    if (re.test(text)) found.add(host);
  }
  return [...found];
}

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
