#!/usr/bin/env node
/**
 * Hard-delete an employer account and everything tied to it.
 * Mirrors scripts/delete-helper.js for the other side of the marketplace.
 *
 * Usage:  node scripts/delete-employer.js EMP-XXXX
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
  const ref = process.argv[2];
  if (!ref || !/^EMP-[A-Z0-9]+$/.test(ref)) {
    console.error('Usage: node scripts/delete-employer.js EMP-XXXX');
    process.exit(1);
  }

  const { data: snap } = await supabase
    .from('employer_accounts')
    .select('employer_ref, first_name, last_name, email, created_at')
    .eq('employer_ref', ref)
    .maybeSingle();
  if (!snap) { console.log(`${ref}: no such employer.`); return; }
  console.log(`${ref}: ${snap.first_name} ${snap.last_name || ''}  ${snap.email}`);

  // Storage cleanup — employer photos live under employer-photos/<ref>/.
  const { data: files } = await supabase.storage.from('employer-photos').list(ref, { limit: 100 });
  if (files && files.length > 0) {
    const paths = files.map(f => `${ref}/${f.name}`);
    const { error: rmErr } = await supabase.storage.from('employer-photos').remove(paths);
    console.log(`  storage:employer-photos/${ref}  ${rmErr ? `error ${rmErr.message}` : `deleted ${paths.length} file(s)`}`);
  } else {
    console.log(`  storage:employer-photos/${ref}  empty`);
  }

  // Non-cascading explicit tables that key on employer_ref.
  for (const tbl of ['helper_favorites', 'helper_ratings', 'magic_login_tokens', 'push_subscriptions', 'wizard_analytics']) {
    const { error, count } = await supabase
      .from(tbl)
      .delete({ count: 'exact' })
      .eq('employer_ref', ref);
    if (error && !/(does not exist|relation .* does not exist|column .* does not exist)/i.test(error.message)) {
      console.log(`  ${tbl.padEnd(24)}  error: ${error.message}`);
    } else {
      console.log(`  ${tbl.padEnd(24)}  ${count ?? 0} row(s)`);
    }
  }

  // Conversations key the employer side via `employer_id` (not _ref).
  // Messages cascade from conversations.
  const { error: convErr, count: convCount } = await supabase
    .from('conversations')
    .delete({ count: 'exact' })
    .eq('employer_id', ref);
  if (convErr && !/does not exist/.test(convErr.message)) {
    console.log(`  conversations            error: ${convErr.message}`);
  } else {
    console.log(`  conversations            ${convCount ?? 0} row(s)  (cascades messages)`);
  }

  // The main account row.
  const { error: empErr, count: empCount } = await supabase
    .from('employer_accounts')
    .delete({ count: 'exact' })
    .eq('employer_ref', ref);
  if (empErr) {
    console.log(`  employer_accounts        error: ${empErr.message}`);
  } else {
    console.log(`  employer_accounts        ${empCount ?? 0} row(s)`);
  }

  const { count: leftover } = await supabase
    .from('employer_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('employer_ref', ref);
  console.log(`  Verified: ${leftover} employer_accounts row(s) remain for ${ref}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
