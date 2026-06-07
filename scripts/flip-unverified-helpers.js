#!/usr/bin/env node
/**
 * Mark all currently-unverified helper accounts as email_verified=true.
 * Used when Jelena says "verifiziere die helfer" — per her standing
 * convention that's a manual DB flip, not a reminder mail.
 *
 * Lists the affected refs first, then updates, then prints a summary.
 *
 * Usage:  node scripts/flip-unverified-helpers.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

async function main() {
  // 1. Snapshot the current unverified set so we can list refs even
  //    after the update flips the predicate.
  const { data: unverified, error: fetchErr } = await supabase
    .from('helper_profiles')
    .select('helper_ref, email, first_name, created_at')
    .eq('email_verified', false)
    .order('created_at', { ascending: false });

  if (fetchErr) throw fetchErr;
  if (!unverified || unverified.length === 0) {
    console.log('No unverified helpers — nothing to do.');
    return;
  }

  console.log(`About to flip ${unverified.length} helper(s) to email_verified=true:`);
  for (const h of unverified) {
    const ageDays = Math.floor((Date.now() - new Date(h.created_at).getTime()) / 86400000);
    console.log(`  ${h.helper_ref}  ${h.first_name?.padEnd(20).slice(0, 20)}  ${h.email?.padEnd(40).slice(0, 40)}  ${ageDays}d old`);
  }

  // 2. Flip them. We update email_verified=true AND set
  //    email_verified_at to now() so analytics/sorts that key on the
  //    timestamp see a real value, not NULL.
  const { error: updErr, count } = await supabase
    .from('helper_profiles')
    .update({ email_verified: true, email_verified_at: new Date().toISOString() }, { count: 'exact' })
    .eq('email_verified', false);

  if (updErr) throw updErr;
  console.log(`\nUpdated ${count} row(s).`);

  // 3. Confirm there are no unverified helpers left.
  const { count: leftover } = await supabase
    .from('helper_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('email_verified', false);
  console.log(`Remaining unverified helpers after flip: ${leftover}`);
}

main().catch(e => { console.error(e); process.exit(1); });
