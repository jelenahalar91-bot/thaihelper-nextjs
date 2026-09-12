#!/usr/bin/env node
/**
 * Admin script: email every family whose LIVE job post has no usable job
 * description, asking them to fill it in.
 *
 * Why: the categories ("nanny", "pet sitter") were the only required part of
 * a job post, so a large share of active employer profiles carry ticked
 * boxes and an empty description. A helper reading such a post can't tell
 * the hours, the children's ages, how many dogs and how big — so they either
 * skip it or apply blind. The description is a required field now
 * (JOB_DESCRIPTION_MIN_LENGTH in lib/constants/employer.js); this script is
 * the one-off catch-up for the profiles that predate that rule.
 *
 * Who gets mailed: accounts whose profile is publicly listed
 * (search_status is anything but 'hidden' — NULL counts as listed, same rule
 * as /api/employers) and where at least one selected category has no
 * description of its own. A long legacy flat job_description still counts as
 * filled in, exactly as the app's validator treats it.
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
const { missingJobDescriptions } = require('../lib/constants/employer.js');
const { sendJobDescriptionReminderEmail } = dryRun && !RESEND_KEY
  ? { sendJobDescriptionReminderEmail: null }
  : require('../lib/send-confirmation-email.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const { data: accounts, error } = await query;
  if (error) {
    console.error('Failed to load employer accounts:', error.message);
    process.exit(1);
  }

  const targets = [];
  const skipped = { hidden: 0, complete: 0, already_reminded: 0, unverified: 0, no_email: 0 };

  for (const row of accounts || []) {
    // 'hidden' profiles aren't shown to helpers, so an empty description
    // hurts nobody — leave them alone. NULL counts as listed (pre-migration
    // rows), matching the filter in /api/employers.
    if (row.search_status === 'hidden') { skipped.hidden++; continue; }
    if (!row.email) { skipped.no_email++; continue; }
    if (verifiedOnly && row.email_verified === false) { skipped.unverified++; continue; }
    if (row.job_description_reminder_sent_at && !force) { skipped.already_reminded++; continue; }

    const hasPerCategory = !!(row.job_details && Object.keys(row.job_details).length > 0);
    const missing = missingJobDescriptions(
      row.looking_for,
      row.job_details,
      hasPerCategory ? '' : (row.job_description || ''),
    );
    // A profile with no categories at all says even less than one with an
    // empty description, so it needs the same nudge — the validator returns
    // an empty list for it (nothing to be missing), hence the extra check.
    const noCategories = String(row.looking_for || '').trim() === '';
    if (missing.length === 0 && !noCategories) { skipped.complete++; continue; }

    targets.push({ ...row, missing });
  }

  const queue = limitArg > 0 ? targets.slice(0, limitArg) : targets;

  console.log(`Scanned ${accounts?.length || 0} employer accounts`);
  console.log(`  needs a description: ${targets.length}`);
  console.log(`  skipped —`, skipped);
  console.log(`  sending to: ${queue.length}${dryRun ? ' (dry run)' : ''}\n`);

  let sent = 0;
  let failed = 0;

  for (const row of queue) {
    const label = `${row.employer_ref} <${row.email}> missing: ${row.missing.join(', ') || '(no categories selected)'}`;

    if (dryRun) {
      console.log(`DRY  ${label}`);
      continue;
    }

    try {
      await sendJobDescriptionReminderEmail({
        firstName: row.first_name,
        email: row.email,
        ref: row.employer_ref,
        missingCategories: row.missing,
      });

      const { error: updateError } = await supabase
        .from('employer_accounts')
        .update({ job_description_reminder_sent_at: new Date().toISOString() })
        .eq('employer_ref', row.employer_ref);
      if (updateError) {
        // The mail is already out; a failed stamp only risks a duplicate on
        // the next run, so report it rather than aborting the batch.
        console.warn(`WARN could not stamp ${row.employer_ref}: ${updateError.message}`);
      }

      sent++;
      console.log(`SENT ${label}`);
    } catch (err) {
      failed++;
      console.error(`FAIL ${label}: ${err.message}`);
    }

    // Resend rate-limits bursts; keep well under it.
    await sleep(600);
  }

  console.log(`\nDone. sent=${sent} failed=${failed}${dryRun ? ' (dry run — nothing was sent)' : ''}`);
})();
