#!/usr/bin/env node
/**
 * Suspend (or restore) an employer account — manual moderation tool.
 *
 * Since 2026-09-09 a suspension is a single field — `status` (added by
 * scripts/supabase-account-status.sql). It closes every door on its own:
 *
 *   hasActiveAccess()   returns false        → cannot send messages or start
 *                                              conversations. Both endpoints
 *                                              read status live from the DB,
 *                                              never from the JWT, so an
 *                                              existing 30-day session dies
 *                                              instantly
 *   /api/auth, /api/employer-auth            → refuse the login with
 *                                              account_suspended, before the
 *                                              verify-gate that would mail a
 *                                              fresh way back in
 *
 * search_status = 'hidden' is still set alongside, because the public listing
 * filters on that field rather than on status.
 *
 * The account's real email address is left intact — the earlier version of
 * this script overwrote it with a sentinel, which was the only way to stop
 * the login before `status` existed.
 *
 * The original values are appended to scripts/.suspended-accounts.jsonl before
 * anything is written, and --restore replays them.
 *
 * Since 2026-09-11 a suspension also blocks the contact handles the account was
 * pushing (lib/contact-blocklist.js). Suspending the login alone did not stop
 * EMP-B4MUCP: the same person re-registered the next day with a fresh Gmail
 * address and kept sending the same LINE ID. Blocking the handle is what makes
 * the suspension survive re-registration. --restore lifts those again.
 *
 * Usage:
 *   node scripts/suspend-employer.js EMP-XXXXXX --reason "mass off-platform spam"
 *   node scripts/suspend-employer.js EMP-XXXXXX --restore
 *   node scripts/suspend-employer.js EMP-XXXXXX --dry-run
 *
 *   --include-single   also block handles seen in only ONE conversation. Off by
 *                      default: scammers ask helpers to send their own link, and
 *                      an echoed handle would otherwise blocklist an innocent
 *                      helper's LINE ID platform-wide.
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

const LOG = path.join(__dirname, '.suspended-accounts.jsonl');
const FIELDS = ['employer_ref', 'email', 'email_verified', 'search_status', 'notify_on_message', 'status', 'status_reason', 'status_changed_at'];

const args = process.argv.slice(2);
const ref = (args.find((a) => !a.startsWith('--')) || '').toUpperCase();
const restore = args.includes('--restore');
const dryRun = args.includes('--dry-run');
const includeSingle = args.includes('--include-single');
const reason = (() => {
  const i = args.indexOf('--reason');
  return i >= 0 ? args[i + 1] || '' : '';
})();

if (!/^EMP-[A-Z0-9]+$/.test(ref)) {
  console.error('Usage: node scripts/suspend-employer.js EMP-XXXXXX [--reason "..."] [--restore] [--dry-run] [--include-single]');
  process.exit(1);
}

// Lazy-require so .env is loaded first, and so the same module the send path
// uses is the one that decides what a handle looks like.
const { harvestHandles, releaseHandles } = require('../lib/contact-blocklist');

function readLog() {
  if (!fs.existsSync(LOG)) return [];
  return fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

async function main() {
  const { data: before, error } = await supabase
    .from('employer_accounts')
    .select(FIELDS.join(', '))
    .eq('employer_ref', ref)
    .maybeSingle();

  if (error) { console.error('Lookup failed:', error.message); process.exit(1); }
  if (!before) { console.error(`No employer ${ref}.`); process.exit(1); }

  console.log('Current state:', JSON.stringify(before, null, 2));

  // Suspending an already-suspended account would record the suspended row as
  // the "before" state and destroy the restore path. Use
  // scripts/backfill-blocked-contacts.js to (re)harvest its handles instead.
  if (!restore && before.status === 'suspended') {
    console.error(`\n${ref} is already suspended — refusing, so the restore record stays intact.`);
    process.exit(1);
  }

  let patch;
  if (restore) {
    const entry = readLog().reverse().find((e) => e.employer_ref === ref && e.action === 'suspend');
    if (!entry) { console.error(`No suspension on record for ${ref} — cannot restore.`); process.exit(1); }
    patch = { ...entry.before };
    delete patch.employer_ref;
    // Entries written by the pre-status version of this script have no status
    // field; restoring one must still clear the suspension.
    patch.status = 'active';
    patch.status_reason = null;
    patch.status_changed_at = new Date().toISOString();
    console.log(`\nRestoring values recorded ${entry.at}.`);
  } else {
    patch = {
      status: 'suspended',
      status_reason: reason || null,
      status_changed_at: new Date().toISOString(),
      search_status: 'hidden',
      notify_on_message: false,
    };
  }

  console.log('Patch:', JSON.stringify(patch, null, 2));

  if (dryRun) {
    if (restore) {
      console.log('\nWould unblock every contact handle harvested from this account.');
    } else {
      const would = await harvestHandles(supabase, ref, reason || null, { includeSingle, dryRun: true });
      console.log(would.length
        ? `\nWould block ${would.length} contact handle(s):\n${would.map((h) => `  ${h.handle}  (${h.spread} conversations)`).join('\n')}`
        : '\nWould block no contact handles.');
    }
    console.log('\n--dry-run: nothing written.');
    return;
  }

  // Record BEFORE writing, so a crash mid-write still leaves a restore path.
  fs.appendFileSync(LOG, JSON.stringify({
    at: new Date().toISOString(),
    action: restore ? 'restore' : 'suspend',
    employer_ref: ref,
    reason: reason || null,
    before,
  }) + '\n');

  const { error: updErr } = await supabase
    .from('employer_accounts')
    .update(patch)
    .eq('employer_ref', ref);

  if (updErr) { console.error('Update failed:', updErr.message); process.exit(1); }
  console.log(`\n${restore ? 'Restored' : 'Suspended'} ${ref}. Recorded in ${path.basename(LOG)}.`);

  // Contact blocklist. A failure here must not leave the caller thinking the
  // account is unsuspended — it is; report and exit non-zero so it gets redone.
  try {
    if (restore) {
      const lifted = await releaseHandles(supabase, ref);
      console.log(lifted.length
        ? `Unblocked ${lifted.length} handle(s): ${lifted.join(', ')}`
        : 'No blocked handles to lift.');
    } else {
      const blocked = await harvestHandles(supabase, ref, reason || null, { includeSingle });
      if (!blocked.length) {
        console.log(includeSingle
          ? 'No contact handles found in this account\'s messages.'
          : 'No handle reached 2+ conversations — nothing blocked (--include-single to force).');
      } else {
        console.log(`Blocked ${blocked.length} contact handle(s):`);
        for (const h of blocked) console.log(`  ${h.handle}  (${h.spread} conversations)`);
      }
    }
  } catch (e) {
    console.error(`\nAccount is ${restore ? 'restored' : 'suspended'}, but the blocklist step failed: ${e.message}`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
