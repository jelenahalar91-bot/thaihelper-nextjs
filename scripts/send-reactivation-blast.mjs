#!/usr/bin/env node
/**
 * "High season has started — are you still looking?" to every helper who is
 * out of the directory for being dormant.
 * Template: lib/emails/reactivate-or-remove.js.
 *
 * The recipient list is NOT hard-coded and not a file. It is derived from the
 * same rule the directory uses, read fresh at send time: INACTIVE_AFTER_DAYS
 * and hiddenForInactivity() in lib/access.js. If the threshold moves, this
 * mails exactly the people the threshold now describes — the letter and the
 * site can never be telling different people different things.
 *
 * The job and family counts in the letter are counted live, the same way
 * /api/employers decides what to show, then rounded DOWN to the nearest ten.
 * Nothing in the letter is a number somebody typed and forgot to recheck.
 *
 * SAFETY: dry-run is the default. --live actually sends.
 * Deduplicated per channel via scripts/.reactivation-blast-sent.jsonl, so a
 * re-run after a crash, a quota wall or a Ctrl-C picks up where it stopped
 * and never mails anyone twice.
 *
 *   node scripts/send-reactivation-blast.mjs                    # dry-run
 *   node scripts/send-reactivation-blast.mjs --preview          # render to drafts/
 *   node scripts/send-reactivation-blast.mjs --test=me@x.com --live
 *   node scripts/send-reactivation-blast.mjs --limit=25 --live  # first 25
 *   node scripts/send-reactivation-blast.mjs --live             # the rest
 *   node scripts/send-reactivation-blast.mjs --line --live      # LINE push too
 *
 * Flags:
 *   --deadline=YYYY-MM-DD  the date named in the letter (default below)
 *   --limit=N              only the first N
 *   --delay=MS             pause between sends (default 1200)
 *   --test=EMAIL           send both language variants to EMAIL and stop
 *   --preview              render both variants to drafts/, send nothing
 *   --line                 also push to the helpers who linked LINE
 *   --skip-email           LINE only (use with --line)
 *   --live                 actually send
 *
 * NOT included here, on purpose: anything that deletes. The letter names a
 * date after which unanswered accounts get closed; closing them is a separate
 * reviewed pass over a list, because the people most likely to miss this
 * letter are the ones it is about.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local before anything reads process.env.
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const { buildReactivateOrRemove, buildLineMessage, sendReactivateOrRemove } =
  await import('../lib/emails/reactivate-or-remove.js');
const { createUnsubscribeToken, buildUnsubscribeUrl } = await import('../lib/unsubscribe.js');
const { createStillLookingToken, buildStillLookingUrl } = await import('../lib/still-looking.js');
const { INACTIVE_AFTER_DAYS, hiddenForInactivity, lastSeenAt, isPubliclyListable,
  hiddenForMissingJobText } = await import('../lib/access.js');

const args = process.argv.slice(2);
const live = args.includes('--live');
const preview = args.includes('--preview');
const withLine = args.includes('--line');
const skipEmail = args.includes('--skip-email');
const testTo = args.find((a) => a.startsWith('--test='))?.slice(7) || null;
const limit = Number(args.find((a) => a.startsWith('--limit='))?.slice(8) || 0);
const delayMs = Number(args.find((a) => a.startsWith('--delay='))?.slice(8) || 1200);

// The date in the letter. One week. Short on purpose: a month of notice is a
// month in which nothing happens, and somebody who does not care today will
// not care more in December. Once this has gone out it is a promise, not a
// knob — moving it earlier breaks it, and moving it later makes the next date
// we announce worth less. Same reasoning as JOB_TEXT_REQUIRED_FROM.
const DEADLINE = args.find((a) => a.startsWith('--deadline='))?.slice(11) || '2026-11-26';
const deadline = Date.parse(`${DEADLINE}T00:00:00Z`);
if (Number.isNaN(deadline)) {
  console.error(`Bad --deadline: ${DEADLINE}`);
  process.exit(1);
}

const LOG_PATH = path.join(__dirname, '.reactivation-blast-sent.jsonl');
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// Logged per channel: a helper can be done for email and still owed a LINE
// push, or the other way round after a quota wall.
function alreadySent() {
  const done = { email: new Set(), line: new Set() };
  if (!fs.existsSync(LOG_PATH)) return done;
  for (const line of fs.readFileSync(LOG_PATH, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      (done[r.channel] || done.email).add(r.ref);
    } catch { /* a torn last line */ }
  }
  return done;
}

function note(ref, channel, extra = {}) {
  fs.appendFileSync(LOG_PATH, `${JSON.stringify({
    ref, channel, at: new Date().toISOString(), deadline: DEADLINE, ...extra,
  })}\n`);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const floorTen = (n) => Math.max(0, Math.floor(n / 10) * 10);

async function page(table, columns) {
  const rows = [];
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table).select(columns).range(from, from + PAGE - 1)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/**
 * What the letter is allowed to claim. Counted the way /api/employers decides
 * what a helper actually sees when she follows the link, so "over N jobs"
 * means N jobs she can really open — not N rows in a table.
 */
async function countOpenJobs() {
  const rows = await page('employer_accounts',
    'employer_ref, looking_for, job_details, job_description, search_status, status, '
    + 'last_login_at, created_at');
  let families = 0; let jobs = 0;
  for (const e of rows) {
    if (e.search_status === 'hidden' || e.search_status === 'paused') continue;
    if (!isPubliclyListable(e)) continue;
    if (hiddenForMissingJobText(e)) continue;
    if (hiddenForInactivity(e)) continue;
    families += 1;
    const d = e.job_details;
    jobs += (d && typeof d === 'object' && Object.keys(d).length)
      ? Object.keys(d).length
      : Math.max(1, String(e.looking_for || '').split(',').filter((s) => s.trim()).length);
  }
  return { families, jobs };
}

async function loadRecipients() {
  const rows = await page('helper_profiles',
    'helper_ref, first_name, email, nationality, status, email_verified, '
    + 'availability_status, notify_on_message, notify_via_line, line_user_id, '
    + 'last_login_at, created_at');

  const skipped = { hidden: 0, unverified: 0, stopped: 0, active: 0, no_email: 0, unsubscribed: 0 };
  const out = [];
  for (const r of rows) {
    if (r.status && r.status !== 'active') { skipped.stopped++; continue; }
    if (r.email_verified !== true) { skipped.unverified++; continue; }
    if (r.availability_status === 'hidden') { skipped.hidden++; continue; }
    if (!hiddenForInactivity(r)) { skipped.active++; continue; }
    if (!r.email) { skipped.no_email++; continue; }
    // notify_on_message = false is what /api/unsubscribe writes. It is the
    // only "stop contacting me" we have, so it stops this too — even though
    // this is about her account rather than a message.
    if (r.notify_on_message === false) { skipped.unsubscribed++; continue; }
    out.push({
      ref: r.helper_ref,
      firstName: (r.first_name || '').trim(),
      email: r.email,
      // Thai first by nationality, not by the languages field — a helper who
      // lists English among her languages is still Thai.
      thaiFirst: r.nationality === 'thai',
      lineUserId: (r.line_user_id && r.notify_via_line !== false) ? r.line_user_id : null,
      lastSeen: lastSeenAt(r),
    });
  }
  // Longest gone first: those are the ones the letter is most clearly true of.
  out.sort((a, b) => a.lastSeen - b.lastSeen);
  return { recipients: out, skipped, scanned: rows.length };
}

async function lineQuota() {
  if (!LINE_TOKEN) return null;
  const headers = { Authorization: `Bearer ${LINE_TOKEN}` };
  const [q, c] = await Promise.all([
    fetch('https://api.line.me/v2/bot/message/quota', { headers }).then((r) => r.json()),
    fetch('https://api.line.me/v2/bot/message/quota/consumption', { headers }).then((r) => r.json()),
  ]);
  if (q?.type !== 'limited') return { limited: false, left: Infinity };
  return { limited: true, limit: q.value, used: c?.totalUsage ?? 0, left: q.value - (c?.totalUsage ?? 0) };
}

async function pushLine(to, text) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
  });
  if (!res.ok) throw new Error(`LINE ${res.status}: ${(await res.text()).slice(0, 160)}`);
}

(async () => {
  const { families, jobs } = await countOpenJobs();
  const jobCount = floorTen(jobs);
  const familyCount = floorTen(families);

  if (testTo) {
    const stillLookingUrl = buildStillLookingUrl(await createStillLookingToken('TH-TEST01'));
    for (const thaiFirst of [false, true]) {
      const opts = {
        firstName: 'Jelena', ref: 'TH-TEST01', email: testTo, deadline,
        stillLookingUrl, jobCount, familyCount, thaiFirst,
        unsubscribeUrl: 'https://www.thaihelper.app/unsubscribe',
      };
      if (!live) {
        console.log(`[dry] would send "${buildReactivateOrRemove(opts).subject}" to ${testTo}`);
        continue;
      }
      await sendReactivateOrRemove(opts);
      console.log(`sent test (${thaiFirst ? 'TH first' : 'EN first'}) to ${testTo}`);
      await sleep(delayMs);
    }
    return;
  }

  const { recipients, skipped, scanned } = await loadRecipients();
  const done = alreadySent();
  const todoEmail = recipients.filter((r) => !done.email.has(r.ref));
  const batch = limit > 0 ? todoEmail.slice(0, limit) : todoEmail;
  const lineAll = recipients.filter((r) => r.lineUserId && !done.line.has(r.ref));

  console.log(`Threshold:   ${INACTIVE_AFTER_DAYS} days (lib/access.js)`);
  console.log(`Deadline:    ${DEADLINE} — the date in the letter`);
  console.log(`In the mail: "over ${jobCount} jobs from more than ${familyCount} families" `
    + `(really ${jobs} / ${families}, rounded down)`);
  console.log(`Scanned:     ${scanned} helper rows`);
  console.log(`Skipped:     ${skipped.active} still active, ${skipped.hidden} hidden themselves, `
    + `${skipped.unverified} never verified, ${skipped.stopped} stopped by staff, `
    + `${skipped.unsubscribed} unsubscribed, ${skipped.no_email} without an address`);
  console.log(`Recipients:  ${recipients.length}  (${done.email.size} already mailed, ${todoEmail.length} left)`);
  console.log(`This run:    ${skipEmail ? 0 : batch.length} emails`
    + `${withLine ? `, ${lineAll.length} LINE` : ''}`
    + `${live ? '  — LIVE' : '  — dry run, nothing will be sent'}`);

  if (withLine) {
    const q = await lineQuota();
    if (!q) {
      console.log('LINE:        no LINE_CHANNEL_ACCESS_TOKEN — skipping LINE.');
    } else if (q.limited) {
      console.log(`LINE quota:  ${q.used}/${q.limit} used this month, ${q.left} left`
        + `${q.left < lineAll.length ? '  ← NOT ENOUGH' : ''}`);
    }
  }
  console.log('');

  if (preview) {
    const dir = path.join(__dirname, '..', 'drafts');
    fs.mkdirSync(dir, { recursive: true });
    const stillLookingUrl = buildStillLookingUrl(await createStillLookingToken('TH-LXI3KK'));
    for (const thaiFirst of [false, true]) {
      const opts = {
        firstName: 'Jatuporn', ref: 'TH-LXI3KK', deadline, stillLookingUrl,
        jobCount, familyCount, thaiFirst,
        unsubscribeUrl: 'https://www.thaihelper.app/unsubscribe',
      };
      const { subject, html, text } = buildReactivateOrRemove(opts);
      const tag = thaiFirst ? 'th-first' : 'en-first';
      fs.writeFileSync(path.join(dir, `reactivation-${tag}.html`), html);
      fs.writeFileSync(path.join(dir, `reactivation-${tag}.txt`), `Subject: ${subject}\n\n${text}`);
      console.log(`  drafts/reactivation-${tag}.html  +  .txt`);
    }
    fs.writeFileSync(path.join(dir, 'reactivation-line.txt'),
      `${buildLineMessage({ firstName: 'Jatuporn', stillLookingUrl, jobCount, thaiFirst: true })}
\n──────────\n
${buildLineMessage({ firstName: 'Melanie', stillLookingUrl, jobCount, thaiFirst: false })}\n`);
    console.log('  drafts/reactivation-line.txt');
    return;
  }

  let ok = 0; let failed = 0;
  if (!skipEmail) {
    for (const r of batch) {
      const days = Math.round((Date.now() - r.lastSeen) / 86400000);
      const tag = `${r.ref}  ${(r.firstName || '—').slice(0, 20).padEnd(20)} `
        + `${r.thaiFirst ? 'TH' : 'EN'}  ${String(days).padStart(3)}d`;

      if (!live) { console.log(`  [dry] mail ${tag}  ${r.email}`); ok++; continue; }

      try {
        const [unsubscribeUrl, stillLookingUrl] = await Promise.all([
          createUnsubscribeToken('helper', r.ref).then(buildUnsubscribeUrl),
          createStillLookingToken(r.ref).then((t) => buildStillLookingUrl(t)),
        ]);
        await sendReactivateOrRemove({
          firstName: r.firstName, ref: r.ref, email: r.email, deadline,
          stillLookingUrl, jobCount, familyCount, thaiFirst: r.thaiFirst, unsubscribeUrl,
        });
        // Logged immediately, so an interrupted run loses at most the person
        // currently in flight.
        note(r.ref, 'email', { email: r.email });
        console.log(`  ✓ mail ${tag}  ${r.email}`);
        ok++;
      } catch (err) {
        console.error(`  ✗ mail ${tag}  ${r.email}  — ${err.message}`);
        failed++;
        if (/quota|rate.?limit|429/i.test(err.message)) {
          console.error('  ! Resend is refusing more mail — stopping. Re-run later; '
            + 'the log means nobody gets a second copy.');
          break;
        }
      }
      await sleep(delayMs);
    }
  }

  let lineOk = 0; let lineFail = 0;
  if (withLine && LINE_TOKEN) {
    // Only to helpers who have the mail, so the LINE note "the full details
    // are in the email we just sent you" is true when she reads it.
    const mailed = alreadySent().email;
    const lineBatch = lineAll.filter((r) => live ? mailed.has(r.ref) : true);
    if (withLine && lineBatch.length < lineAll.length) {
      console.log(`  (${lineAll.length - lineBatch.length} LINE held back — their email has not gone yet)`);
    }
    for (const r of lineBatch) {
      const tag = `${r.ref}  ${(r.firstName || '—').slice(0, 20).padEnd(20)} ${r.thaiFirst ? 'TH' : 'EN'}`;
      if (!live) { console.log(`  [dry] LINE ${tag}`); lineOk++; continue; }
      try {
        const stillLookingUrl = buildStillLookingUrl(await createStillLookingToken(r.ref));
        await pushLine(r.lineUserId, buildLineMessage({
          firstName: r.firstName, stillLookingUrl, jobCount, thaiFirst: r.thaiFirst,
        }));
        note(r.ref, 'line');
        console.log(`  ✓ LINE ${tag}`);
        lineOk++;
      } catch (err) {
        console.error(`  ✗ LINE ${tag}  — ${err.message}`);
        lineFail++;
        if (/monthly limit|429/i.test(err.message)) {
          console.error('  ! LINE monthly quota is gone — stopping LINE. '
            + 'Re-run with --line --skip-email next month.');
          break;
        }
      }
      await sleep(400);
    }
  }

  console.log('');
  console.log(`${live ? 'Sent' : 'Would send'}: ${ok} emails${failed ? `, ${failed} failed` : ''}`
    + `${withLine ? `, ${lineOk} LINE${lineFail ? `, ${lineFail} failed` : ''}` : ''}`);
  if (live && todoEmail.length > batch.length) {
    console.log(`Remaining:   ${todoEmail.length - batch.length} — re-run to continue.`);
  }
  if (failed || lineFail) process.exitCode = 1;
})().catch((err) => { console.error('Fatal:', err); process.exit(1); });
