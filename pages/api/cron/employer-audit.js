// GET /api/cron/employer-audit
//
// Weekly sweep of the family side, Mondays at 02:30 UTC (09:30 Bangkok), with
// one mail at the end — and no mail at all on a quiet week.
//
// WHY THIS EXISTS. The live checks in /api/messages each watch one thing and
// fire as it happens: contact spraying, outreach volume, passport requests,
// massage. Every one of them was written after a human read the messages by
// hand and noticed a shape nothing was watching for. The sweeps that found
// them were irregular — 2026-10-05, 10-14, 10-19, 11-18 — and in the gaps,
// EMP-TLZAVL ran for four days and EMP-DZCDRL for eight before anybody looked.
//
// So this is the part that does not depend on somebody remembering to ask.
//
// WHAT IT CATCHES THAT THE LIVE CHECKS CANNOT. The live checks are per-message:
// they see one message and decide. These are shapes that only exist across a
// week of an account's behaviour:
//
//   identical text to many people  EMP-RTCCUW sent the same paragraph to 30
//                                  helpers — not a job at all, a request for
//                                  someone to guide him around Thailand. No
//                                  word in it trips any filter. The giveaway
//                                  is that it is the SAME paragraph 30 times.
//   a listing with no job text     the signup form has required one since
//                                  2026-10-02, so a new account without one
//                                  means the gate broke, not that somebody
//                                  skipped a field.
//   a number nobody verified       same: impossible through the form since
//                                  2026-10-02. A canary, not a to-do list.
//
// NO MAIL ON A QUIET WEEK, and that is the point rather than a nicety. A
// weekly report that always arrives gets filed unread within a month, and then
// the week it matters it is filed unread too.
//
// Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Same shape as
// the other two crons; without the secret this endpoint is a way to make the
// admin inbox say whatever you like about an account.

import { getServiceSupabase, selectAll } from '../../../lib/supabase';
import { isSolicitation, mentionsPersonalService, suspendCommand } from '../../../lib/spam-signals';
import { documentRequestKind } from '../../../lib/spam-signals';
import { listingHasJobText } from '../../../lib/access';

const WINDOW_DAYS = 7;

// Same paragraph to this many different people inside the window.
//
// ON ITS OWN THIS MEANS NOTHING, which the first test run showed plainly:
// Melissa S Reyes sent one paragraph to 23 people and Caleb Denovan sent one
// to 9, and both are ordinary families pasting an ordinary job ad. Writing the
// advert once and sending it to everyone is what a sensible person does here.
//
// What made EMP-RTCCUW worth finding was not that he sent the same paragraph
// to 30 helpers. It was that the paragraph was not a job: he wanted somebody
// to guide him around Thailand for a business trip, sent from an account
// registered as "driver, housekeeper". Nothing in it is a scam word, so no
// filter saw it.
//
// So both conditions have to hold: the same text to many people, AND no
// household work described anywhere in it. A job ad names the job.
const IDENTICAL_TEXT_ALERT = 8;

// The vocabulary of the work this platform is for, in both languages. A
// broadcast containing none of it is not a job advert, whatever else it is.
// Deliberately generous — matching one word anywhere is enough to stay quiet,
// because the cost of a false silence here is one missed line in one mail and
// the cost of a false finding is the whole digest losing its credibility.
const HOUSEHOLD_WORDS = new RegExp(
  // The boundary goes at the FRONT only, and both halves of that matter.
  //
  // Without a leading \b, "cat" matches inside "communicate", "son" inside
  // "person" and "iron" inside "environment" — which is how EMP-RTCCUW stayed
  // invisible at first: a message about a business trip was ruled a household
  // job because it contained the word "communicate".
  //
  // With a TRAILING \b the stems stop matching the words people actually
  // write: "nann" does not match "nanny", "clean" does not match "cleaning",
  // "child" does not match "children". That version flagged a perfectly
  // ordinary nanny advert as describing no household work at all.
  //
  // So: anchored at the start, open at the end. It silences a few things it
  // should not — "career" contains "care", "category" contains "cat" — and
  // that is the right direction to err. A missed line costs one line; a
  // finding that turns out to be nothing costs the digest its credibility.
  '\\b(clean|cook|chef|meal|food|kitchen|laundry|iron|hous|maid|nann|babysit'
  + '|child|kid|baby|toddler|son|daughter|famil|elder|care|caring|nurse|driv'
  + '|garden|plant|pool|pet|dog|cat|tutor|teach|lesson|shopping|groceri|errand'
  + '|salary|baht|thb)'
  // Thai has no word boundaries, and these are distinctive enough without one.
  + '|(ทำความสะอาด|แม่บ้าน|ทำอาหาร|พี่เลี้ยง|เด็ก|ดูแล|ผู้สูงอายุ|ขับรถ|สวน|สัตว์เลี้ยง|สอน|เงินเดือน|บาท)'
  + '|live[- ]?in',
  'i'
);

// Long enough that two people saying "Hello, are you available?" are not a
// finding. Short enough to catch a reused job ad.
const IDENTICAL_MIN_LENGTH = 120;

function authorize(req) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    return (req.headers.authorization || '') === `Bearer ${expected}`;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('CRON_SECRET not set in production — refusing cron run');
    return false;
  }
  return req.headers['x-vercel-cron'] === '1';
}

// Compare on the words, not the characters: the same ad with a different name
// pasted at the top is the same ad.
function fingerprint(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z฀-๿0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  if (!authorize(req)) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getServiceSupabase();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: employers, error: empErr } = await selectAll(() =>
    supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, last_name, email, city, status, warned_for, '
        + 'phone_verified_at, job_description, job_details, created_at')
      .order('created_at', { ascending: false })
  );
  if (empErr) {
    console.error('[employer-audit] employers:', empErr.message);
    return res.status(500).json({ error: 'load_failed' });
  }
  const byRef = Object.fromEntries((employers || []).map((e) => [e.employer_ref, e]));

  const { data: convs, error: convErr } = await selectAll(() =>
    supabase.from('conversations').select('id, employer_id, helper_ref').order('id')
  );
  if (convErr) {
    console.error('[employer-audit] conversations:', convErr.message);
    return res.status(500).json({ error: 'load_failed' });
  }
  const convOf = Object.fromEntries((convs || []).map((c) => [c.id, c]));

  // Only the window. The whole message table is far too much to pull weekly
  // and nothing here asks a question older than seven days.
  const { data: msgs, error: msgErr } = await selectAll(() =>
    supabase
      .from('messages')
      .select('conversation_id, sender_type, sender_ref, content_original, created_at')
      .eq('sender_type', 'employer')
      .gt('created_at', since)
      .order('created_at', { ascending: true })
  );
  if (msgErr) {
    console.error('[employer-audit] messages:', msgErr.message);
    return res.status(500).json({ error: 'load_failed' });
  }

  // ── per-account tallies over the window ────────────────────────────────
  const perAccount = new Map();
  const get = (ref) => {
    if (!perAccount.has(ref)) {
      perAccount.set(ref, { solicited: 0, mentioned: 0, documents: 0, reached: new Set(), texts: new Map() });
    }
    return perAccount.get(ref);
  };

  for (const m of msgs || []) {
    const conv = convOf[m.conversation_id];
    if (!conv?.employer_id) continue;
    const a = get(conv.employer_id);
    const text = m.content_original || '';
    a.reached.add(conv.helper_ref);
    if (isSolicitation(text)) a.solicited++;
    else if (mentionsPersonalService(text)) a.mentioned++;
    if (documentRequestKind(text)) a.documents++;
    if (text.length >= IDENTICAL_MIN_LENGTH) {
      const fp = fingerprint(text);
      if (!a.texts.has(fp)) a.texts.set(fp, { sample: text, helpers: new Set() });
      a.texts.get(fp).helpers.add(conv.helper_ref);
    }
  }

  const findings = [];
  const label = (ref) => {
    const e = byRef[ref];
    if (!e) return ref;
    return `${ref}  ${e.first_name || ''} ${e.last_name || ''}`.trimEnd()
      + ` <${e.email}>  ${e.city || '—'}${e.status !== 'active' ? `  [${e.status}]` : ''}`;
  };

  for (const [ref, a] of perAccount) {
    const e = byRef[ref];
    if (!e || e.status !== 'active') continue;   // already dealt with
    const lines = [];

    const worstText = [...a.texts.values()]
      .filter((t) => !HOUSEHOLD_WORDS.test(t.sample))
      .sort((x, y) => y.helpers.size - x.helpers.size)[0];
    if (worstText && worstText.helpers.size >= IDENTICAL_TEXT_ALERT) {
      lines.push(`sent the same paragraph to ${worstText.helpers.size} different people,`);
      lines.push('and it does not describe household work at all:');
      lines.push(`    "${worstText.sample.replace(/\s+/g, ' ').slice(0, 200)}…"`);
    }
    if (a.solicited) lines.push(`asked for a massage or stretching (${a.solicited}×)`);
    else if (a.mentioned) lines.push(`mentioned massage or stretching (${a.mentioned}×)`);
    if (a.documents) lines.push(`asked about passports or ID documents (${a.documents}×)`);

    if (lines.length) {
      findings.push([`• ${label(ref)}`, ...lines.map((l) => `    ${l}`)].join('\n'));
    }
  }

  // ── canaries: things the signup form has made impossible since 2026-10-02 ──
  const broken = (employers || []).filter((e) =>
    e.status === 'active' && new Date(e.created_at) > new Date(since)
    && (!listingHasJobText(e) || !e.phone_verified_at));
  if (broken.length) {
    findings.push(
      ['• SIGNUP GATE: accounts created this week without a job text or a verified number.',
        '    The form has required both since 2026-10-02, so this means the gate broke.',
        ...broken.map((e) => `    ${label(e.employer_ref)}`
          + `${listingHasJobText(e) ? '' : ' [no job text]'}${e.phone_verified_at ? '' : ' [no number]'}`),
      ].join('\n')
    );
  }

  const newThisWeek = (employers || []).filter((e) => new Date(e.created_at) > new Date(since)).length;

  if (!findings.length) {
    console.log(`[employer-audit] quiet week: ${newThisWeek} new families, nothing to report`);
    return res.status(200).json({ ok: true, findings: 0, newThisWeek, mailed: false });
  }

  if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'ThaiHelper <noreply@thaihelper.app>',
        to: process.env.ADMIN_EMAIL,
        subject: `Weekly family check: ${findings.length} to look at`,
        text: [
          `${findings.length} ${findings.length === 1 ? 'account is' : 'accounts are'} worth reading this week.`,
          `${newThisWeek} families registered in the last ${WINDOW_DAYS} days.`,
          '',
          'None of this is a verdict — these are shapes that are usually innocent and',
          'occasionally are not, which is why they come to you rather than to a rule.',
          '',
          findings.join('\n\n'),
          '',
          '──────────',
          '',
          'To read a conversation, open the family in the dashboard.',
          `To stop an account: ${suspendCommand('EMP-XXXXXX')}`,
          '',
          'A quiet week sends no mail at all, so this arriving means something is in it.',
        ].join('\n'),
      });
    } catch (err) {
      console.error('[employer-audit] mail failed:', err.message);
      return res.status(200).json({ ok: true, findings: findings.length, mailed: false, error: err.message });
    }
  }

  console.log(`[employer-audit] ${findings.length} findings, ${newThisWeek} new families`);
  return res.status(200).json({ ok: true, findings: findings.length, newThisWeek, mailed: true });
}
