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
 * Usage:
 *   node scripts/backfill-blocked-contacts.js --dry-run
 *   node scripts/backfill-blocked-contacts.js
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

const dryRun = process.argv.includes('--dry-run');

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

  if (!accounts.length) {
    console.log('No suspended accounts.');
    return;
  }
  console.log(`${accounts.length} suspended account(s)${dryRun ? ' — dry run' : ''}:\n`);

  let total = 0;
  for (const { ref, reason } of accounts) {
    const handles = await harvestHandles(supabase, ref, reason, { dryRun });
    total += handles.length;
    console.log(`${ref}: ${handles.length || 'no'} handle(s)`);
    for (const h of handles) console.log(`    ${h.handle}  (${h.spread} conversations)`);
  }

  console.log(`\n${dryRun ? 'Would block' : 'Blocked'} ${total} handle(s) in total.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
