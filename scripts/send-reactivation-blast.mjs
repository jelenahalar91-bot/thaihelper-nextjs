#!/usr/bin/env node
/**
 * "Log in or we'll close the account" — to every helper unlisted for being
 * dormant. Template: lib/emails/reactivate-or-remove.js.
 *
 * The recipient list is NOT hard-coded and not a file. It is derived from the
 * same rule the directory uses, read fresh at send time: INACTIVE_AFTER_DAYS
 * and hiddenForInactivity() in lib/access.js. If the threshold moves, this
 * mails exactly the people the threshold now describes — the letter and the
 * site can never be telling different people different things.
 *
 * SAFETY: dry-run is the default. --live actually sends.
 * Deduplicated via scripts/.reactivation-blast-sent.jsonl, so a re-run after
 * a crash, a quota wall or a Ctrl-C picks up where it stopped and never mails
 * anyone twice.
 *
 *   node scripts/send-reactivation-blast.mjs                      # dry-run, all
 *   node scripts/send-reactivation-blast.mjs --test=me@x.com      # one rendered test
 *   node scripts/send-reactivation-blast.mjs --preview            # write both HTML variants to disk
 *   node scripts/send-reactivation-blast.mjs --limit=25 --live    # first 25, for real
 *   node scripts/send-reactivation-blast.mjs --live               # the rest
 *
 * Flags:
 *   --deadline=YYYY-MM-DD  the date named in the letter (default below)
 *   --limit=N              only the first N
 *   --delay=MS             pause between sends (default 1200)
 *   --test=EMAIL           send both language variants to EMAIL and stop
 *   --preview              render to /tmp-style files, send nothing, touch nothing
 *   --live                 actually send
 *
 * NOT included here, on purpose: anything that deletes. The letter names a
 * date after which unanswered accounts get closed; closing them is a separate,
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

const { buildReactivateOrRemove, sendReactivateOrRemove } =
  await import('../lib/emails/reactivate-or-remove.js');
const { createUnsubscribeToken, buildUnsubscribeUrl } = await import('../lib/unsubscribe.js');
const { INACTIVE_AFTER_DAYS, hiddenForInactivity, lastSeenAt } =
  await import('../lib/access.js');

const args = process.argv.slice(2);
const live = args.includes('--live');
const preview = args.includes('--preview');
const testTo = args.find((a) => a.startsWith('--test='))?.slice(7) || null;
const limit = Number(args.find((a) => a.startsWith('--limit='))?.slice(8) || 0);
const delayMs = Number(args.find((a) => a.startsWith('--delay='))?.slice(8) || 1200);

// The date in the letter. A month and a day's notice from 19.11.2026, clear of
// Christmas. Once this has gone out it is a promise, not a knob — moving it
// earlier breaks it, and moving it later makes the next date we announce worth
// less. Same reasoning as JOB_TEXT_REQUIRED_FROM in lib/access.js.
const DEADLINE = args.find((a) => a.startsWith('--deadline='))?.slice(11) || '2026-12-20';
const deadline = Date.parse(`${DEADLINE}T00:00:00Z`);
if (Number.isNaN(deadline)) {
  console.error(`Bad --deadline: ${DEADLINE}`);
  process.exit(1);
}

const LOG_PATH = path.join(__dirname, '.reactivation-blast-sent.jsonl');

function alreadySent() {
  if (!fs.existsSync(LOG_PATH)) return new Set();
  const refs = new Set();
  for (const line of fs.readFileSync(LOG_PATH, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { refs.add(JSON.parse(line).ref); } catch { /* a torn last line */ }
  }
  return refs;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadRecipients() {
  // Paged by hand: 1134 helper rows is past the point where an unpaginated
  // select starts dropping the oldest ones silently.
  const rows = [];
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, email, nationality, status, email_verified, '
        + 'availability_status, notify_on_message, last_login_at, created_at')
      .range(from, from + PAGE - 1)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }

  const reasons = { hidden: 0, unverified: 0, stopped: 0, active: 0, no_email: 0, unsubscribed: 0 };
  const out = [];
  for (const r of rows) {
    if (r.status && r.status !== 'active') { reasons.stopped++; continue; }
    if (r.email_verified !== true) { reasons.unverified++; continue; }
    if (r.availability_status === 'hidden') { reasons.hidden++; continue; }
    if (!hiddenForInactivity(r)) { reasons.active++; continue; }
    if (!r.email) { reasons.no_email++; continue; }
    // notify_on_message = false is what /api/unsubscribe writes. It is the
    // only "stop emailing me" we have, so it stops this too — even though
    // this is about her account rather than a message.
    if (r.notify_on_message === false) { reasons.unsubscribed++; continue; }
    out.push({
      ref: r.helper_ref,
      firstName: (r.first_name || '').trim(),
      email: r.email,
      // Thai first by nationality, not by the languages field — a helper who
      // lists English among her languages is still Thai.
      thaiFirst: r.nationality === 'thai',
      lastSeen: lastSeenAt(r),
    });
  }
  // Longest gone first: those are the ones the letter is most clearly true of.
  out.sort((a, b) => a.lastSeen - b.lastSeen);
  return { recipients: out, reasons, scanned: rows.length };
}

(async () => {
  if (testTo) {
    for (const thaiFirst of [false, true]) {
      const { subject } = buildReactivateOrRemove({
        firstName: 'Jelena', ref: 'TH-TEST01', lastSeen: Date.parse('2026-07-07T01:17:28Z'),
        deadline, thaiFirst,
      });
      if (!live) {
        console.log(`[dry-run] would send "${subject}" to ${testTo}`);
        continue;
      }
      await sendReactivateOrRemove({
        firstName: 'Jelena', ref: 'TH-TEST01', email: testTo,
        lastSeen: Date.parse('2026-07-07T01:17:28Z'), deadline, thaiFirst,
        unsubscribeUrl: 'https://www.thaihelper.app/unsubscribe',
      });
      console.log(`sent test (${thaiFirst ? 'TH first' : 'EN first'}) to ${testTo}`);
      await sleep(delayMs);
    }
    return;
  }

  const { recipients, reasons, scanned } = await loadRecipients();
  const sent = alreadySent();
  const todo = recipients.filter((r) => !sent.has(r.ref));
  const batch = limit > 0 ? todo.slice(0, limit) : todo;

  console.log(`Threshold:   ${INACTIVE_AFTER_DAYS} days (lib/access.js)`);
  console.log(`Deadline:    ${DEADLINE} — the date in the letter`);
  console.log(`Scanned:     ${scanned} helper rows`);
  console.log(`Skipped:     ${reasons.active} still active, ${reasons.hidden} hidden themselves, `
    + `${reasons.unverified} never verified, ${reasons.stopped} stopped by staff, `
    + `${reasons.unsubscribed} unsubscribed, ${reasons.no_email} without an address`);
  console.log(`Recipients:  ${recipients.length}  (${sent.size} already mailed, ${todo.length} left)`);
  console.log(`This run:    ${batch.length}${live ? '  — LIVE' : '  — dry run, nothing will be sent'}`);
  console.log('');

  if (preview) {
    const dir = path.join(__dirname, '..', 'drafts');
    fs.mkdirSync(dir, { recursive: true });
    for (const thaiFirst of [false, true]) {
      const { subject, html, text } = buildReactivateOrRemove({
        firstName: 'Jatuporn', ref: 'TH-LXI3KK',
        lastSeen: Date.parse('2026-07-07T01:17:28Z'), deadline, thaiFirst,
        unsubscribeUrl: 'https://www.thaihelper.app/unsubscribe',
      });
      const tag = thaiFirst ? 'th-first' : 'en-first';
      fs.writeFileSync(path.join(dir, `reactivation-${tag}.html`), html);
      fs.writeFileSync(path.join(dir, `reactivation-${tag}.txt`), `Subject: ${subject}\n\n${text}`);
      console.log(`  drafts/reactivation-${tag}.html  +  .txt`);
    }
    return;
  }

  let ok = 0; let failed = 0;
  for (const r of batch) {
    const days = Math.round((Date.now() - r.lastSeen) / 86400000);
    const tag = `${r.ref}  ${(r.firstName || '—').slice(0, 22).padEnd(22)} `
      + `${r.thaiFirst ? 'TH' : 'EN'}  ${String(days).padStart(3)}d`;

    if (!live) {
      console.log(`  [dry] ${tag}  ${r.email}`);
      ok++;
      continue;
    }

    try {
      const unsubscribeUrl = buildUnsubscribeUrl(await createUnsubscribeToken('helper', r.ref));
      await sendReactivateOrRemove({
        firstName: r.firstName, ref: r.ref, email: r.email,
        lastSeen: r.lastSeen, deadline, thaiFirst: r.thaiFirst, unsubscribeUrl,
      });
      // Logged immediately, one line per send, so an interrupted run loses at
      // most the person currently in flight.
      fs.appendFileSync(LOG_PATH, `${JSON.stringify({
        ref: r.ref, email: r.email, at: new Date().toISOString(), deadline: DEADLINE,
      })}\n`);
      console.log(`  ✓ ${tag}  ${r.email}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${tag}  ${r.email}  — ${err.message}`);
      failed++;
      if (/quota|rate.?limit|429/i.test(err.message)) {
        console.error('  ! Resend is refusing more mail — stopping here. '
          + 'Re-run later; the log means nobody gets a second copy.');
        break;
      }
    }
    await sleep(delayMs);
  }

  console.log('');
  console.log(`${live ? 'Sent' : 'Would send'}: ${ok}${failed ? `, failed: ${failed}` : ''}`);
  if (live && todo.length > batch.length) {
    console.log(`Remaining:   ${todo.length - batch.length} — re-run to continue.`);
  }
  if (failed) process.exitCode = 1;
})().catch((err) => { console.error('Fatal:', err); process.exit(1); });
