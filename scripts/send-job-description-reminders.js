#!/usr/bin/env node
/**
 * Admin script: mail every family whose LIVE job post has no usable
 * description, once.
 *
 * Why: a post with ticked categories and no text tells a helper nothing —
 * not the hours, not the children's ages, not how big the dogs are. She
 * applies blind or skips it. A description per selected category has been
 * required at registration since 2026-10-02 and it worked (of 105 accounts
 * opened since, 3 are empty, all three from the deploy day itself), but the
 * rule never reached the profiles that predate it.
 *
 * Who gets mailed: accounts that are publicly listed (search_status is
 * anything but 'hidden'; NULL counts as listed, same rule as /api/employers)
 * and where at least one selected category has no text of its own. A legacy
 * flat job_description still counts as described, exactly as the app's
 * validator and the dashboard banner treat it — those families are asked to
 * split it per category on their next edit, not mailed about it.
 *
 * Usage:
 *   node scripts/send-job-description-reminders.js --dry-run       # preview
 *   node scripts/send-job-description-reminders.js                 # send
 *   node scripts/send-job-description-reminders.js --emp=EMP-XXX   # one account
 *   node scripts/send-job-description-reminders.js --limit=25      # first 25
 *   node scripts/send-job-description-reminders.js --verified-only # skip unverified emails
 *   node scripts/send-job-description-reminders.js --force         # mail again
 *
 * Run scripts/supabase-employer-job-description-reminder.sql first — the
 * job_description_reminder_sent_at column is what stops a family being
 * mailed twice.
 */

const path = require('path');
const fs = require('fs');

// Load .env.local (same loader as the other admin scripts).
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) return;
    const [, k, raw] = m;
    if (!process.env[k]) process.env[k] = raw.replace(/^['"]|['"]$/g, '');
  });
}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SR_KEY) {
  console.error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const verifiedOnly = args.includes('--verified-only');
const empArg = args.find((a) => a.startsWith('--emp='))?.slice(6);
const limitArg = parseInt(args.find((a) => a.startsWith('--limit='))?.slice(8) || '0', 10);

if (!RESEND_KEY && !dryRun) {
  console.error('Missing RESEND_API_KEY (use --dry-run to preview without sending)');
  process.exit(1);
}

// Required *after* the env is populated — the email module builds its Resend
// client at import time.
const { JOB_TEXT_MIN_LENGTH, JOB_DESCRIPTION_EXAMPLES } = require('../lib/constants/employer');
const { sendJobDescriptionReminderEmail } = dryRun && !RESEND_KEY
  ? { sendJobDescriptionReminderEmail: null }
  : require('../lib/send-confirmation-email');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The per-category text as the length check sees it. */
function textOf(value) {
  return String((typeof value === 'string' ? value : value?.text) || '').trim();
}

/**
 * Which selected categories have no usable text — the same rule as
 * missingJobTexts() on the server and the dashboard banner. Kept inline so
 * the script does not drag the Translate client in through
 * lib/employer-job-details.js.
 */
function missingFor(row) {
  const roles = String(row.looking_for || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
  if (!roles.length) return [];

  const bag = row.job_details && typeof row.job_details === 'object' && !Array.isArray(row.job_details)
    ? row.job_details
    : {};

  // A legacy flat description counts as described, but only while there are
  // no per-category texts at all.
  const anyDetail = Object.values(bag).some((v) => textOf(v).length > 0);
  const flat = String(row.job_description || '').trim();
  if (!anyDetail && flat.length >= JOB_TEXT_MIN_LENGTH) return [];

  return roles.filter((cat) => textOf(bag[cat]).length < JOB_TEXT_MIN_LENGTH);
}

(async () => {
  const supabase = createClient(SUPABASE_URL, SR_KEY, {
    auth: { persistSession: false },
  });

  let query = supabase
    .from('employer_accounts')
    .select(
      'employer_ref, first_name, email, email_verified, search_status, ' +
      'looking_for, job_details, job_description, job_description_reminder_sent_at, created_at'
    )
    .order('created_at', { ascending: true });

  if (empArg) query = query.eq('employer_ref', empArg);

  const { data, error } = await query;
  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  const targets = [];
  for (const row of data || []) {
    if (!row.email) continue;
    if (row.search_status === 'hidden') continue;
    if (verifiedOnly && !row.email_verified) continue;
    if (!force && row.job_description_reminder_sent_at) continue;

    const missing = missingFor(row);
    if (!missing.length) continue;

    targets.push({ row, missing });
    if (limitArg && targets.length >= limitArg) break;
  }

  console.log(`${targets.length} famil${targets.length === 1 ? 'y' : 'ies'} to mail${dryRun ? ' (dry run)' : ''}\n`);

  let sent = 0;
  let failed = 0;

  for (const { row, missing } of targets) {
    const line = `${row.employer_ref}  ${(row.first_name || '—').padEnd(14)} ${missing.join(', ')}`;

    if (dryRun) {
      console.log(`  would mail  ${line}`);
      continue;
    }

    try {
      const examples = {};
      for (const cat of missing) {
        const ex = JOB_DESCRIPTION_EXAMPLES[cat];
        if (ex?.en) examples[cat] = ex.en;
      }

      await sendJobDescriptionReminderEmail({
        firstName: row.first_name,
        email: row.email,
        categories: missing,
        examples,
      });

      // Stamp only after the send actually succeeded, so a failure can be
      // retried by running the script again.
      const { error: stampError } = await supabase
        .from('employer_accounts')
        .update({ job_description_reminder_sent_at: new Date().toISOString() })
        .eq('employer_ref', row.employer_ref);

      if (stampError) {
        console.error(`  STAMP FAILED ${line} — ${stampError.message}`);
      }

      sent += 1;
      console.log(`  mailed      ${line}`);
    } catch (err) {
      failed += 1;
      console.error(`  FAILED      ${line} — ${err.message}`);
    }

    // Resend's rate limit is well above this; the pause is here so a run of
    // 60 mails does not look like a burst to anybody's spam filter.
    await sleep(600);
  }

  if (!dryRun) {
    console.log(`\n${sent} sent, ${failed} failed.`);
  }
})();
