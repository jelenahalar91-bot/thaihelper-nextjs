#!/usr/bin/env node
/**
 * Seed blocked_contacts from accounts that were already suspended.
 *
 * scripts/suspend-employer.js harvests handles as part of suspending, but only
 * since 2026-09-11. Accounts stopped before that have their logins closed and
 * their handles still working — this fills that gap.
 *
 * Safe to re-run: handles are upserted, and it never touches account state.
 * Deliberately NOT done by re-running suspend-employer.js on an already
 * suspended account, which would record the suspended row as the "before"
 * state in .suspended-accounts.jsonl and destroy the restore path.
 *
 * A handle must appear in 2+ of the account's conversations to be blocked;
 * see MIN_HANDLE_SPREAD in lib/contact-blocklist.js for why.
 *
 * --include-single lifts that threshold, and therefore only ever belongs to a
 * named account (--ref): the threshold exists because a handle seen once may
 * be a helper's own, echoed back at her, and blocking it platform-wide would
 * silence her everywhere. Over all suspended accounts at once that risk is
 * unreviewable, so --include-single without --ref is refused.
 *
 * Usage:
 *   node scripts/backfill-blocked-contacts.js --dry-run
 *   node scripts/backfill-blocked-contacts.js
 *   node scripts/backfill-blocked-contacts.js --ref EMP-XXXXXX --include-single
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { harvestHandles } = require('../lib/contact-blocklist');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const includeSingle = args.includes('--include-single');
const onlyRef = (() => {
  const i = args.indexOf('--ref');
  return i >= 0 ? (args[i + 1] || '').toUpperCase() : '';
})();

if (includeSingle && !onlyRef) {
  console.error('--include-single needs --ref EMP-XXXXXX|TH-XXXXXX: a one-conversation'
    + ' handle may belong to the helper it was echoed at, so it is only ever blocked'
    + ' for an account somebody has looked at.');
  process.exit(1);
}
if (onlyRef && !/^(EMP|TH)-[A-Z0-9]+$/.test(onlyRef)) {
  console.error(`Not a ref: ${onlyRef}`);
  process.exit(1);
}

async function main() {
  const accounts = [];
  for (const [table, refCol] of [
    ['employer_accounts', 'employer_ref'],
    ['helper_profiles', 'helper_ref'],
  ]) {
    const { data, error } = await supabase
      .from(table)
      .select(`${refCol}, status_reason`)
      .eq('status', 'suspended');
    if (error) throw new Error(`${table}: ${error.message}`);
    for (const row of data || []) {
      accounts.push({ ref: row[refCol], reason: row.status_reason });
    }
  }

  const selected = onlyRef ? accounts.filter((a) => a.ref === onlyRef) : accounts;

  if (!selected.length) {
    console.log(onlyRef
      ? `${onlyRef} is not a suspended account — nothing to harvest.`
      : 'No suspended accounts.');
    return;
  }
  console.log(`${selected.length} suspended account(s)${includeSingle ? ', single-conversation handles included' : ''}${dryRun ? ' — dry run' : ''}:\n`);

  let total = 0;
  for (const { ref, reason } of selected) {
    const handles = await harvestHandles(supabase, ref, reason, { dryRun, includeSingle });
    total += handles.length;
    console.log(`${ref}: ${handles.length || 'no'} handle(s)`);
    for (const h of handles) console.log(`    ${h.handle}  (${h.spread} conversations)`);
  }

  console.log(`\n${dryRun ? 'Would block' : 'Blocked'} ${total} handle(s) in total.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
