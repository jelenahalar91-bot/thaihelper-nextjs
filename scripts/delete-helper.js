#!/usr/bin/env node
/**
 * Hard-delete a helper account and every artefact tied to it.
 * Touches both database tables and Supabase Storage buckets.
 *
 * Usage:  node scripts/delete-helper.js TH-XXXX
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
  if (!ref || !/^TH-[A-Z0-9]+$/.test(ref)) {
    console.error('Usage: node scripts/delete-helper.js TH-XXXX');
    process.exit(1);
  }

  console.log(`Deleting helper ${ref}…\n`);

  // 1. Snapshot the helper row before we wipe it.
  const { data: snap } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, last_name, email, created_at')
    .eq('helper_ref', ref)
    .maybeSingle();
  if (!snap) { console.log('No such helper.'); return; }
  console.log(`  Found: ${snap.first_name} ${snap.last_name || ''}  ${snap.email}  (joined ${snap.created_at.slice(0, 10)})`);
  console.log('');

  // 2. Storage cleanup — list everything under the helper's prefix and
  //    delete in batches. Two buckets carry per-helper files.
  for (const bucket of ['profile-photos', 'helper-documents']) {
    const { data: files, error: listErr } = await supabase.storage.from(bucket).list(ref, { limit: 100 });
    if (listErr) {
      console.log(`  storage:${bucket}/${ref}  list error: ${listErr.message}`);
      continue;
    }
    if (!files || files.length === 0) {
      console.log(`  storage:${bucket}/${ref}  empty`);
      continue;
    }
    const paths = files.map(f => `${ref}/${f.name}`);
    const { error: rmErr } = await supabase.storage.from(bucket).remove(paths);
    console.log(`  storage:${bucket}/${ref}  ${rmErr ? `error ${rmErr.message}` : `deleted ${paths.length} file(s)`}`);
  }

  // 3. Tables that don't cascade — delete by helper_ref explicitly.
  //    Order doesn't really matter since none reference each other.
  const explicitTables = [
    'helper_ratings',
    'helper_favorites',
    'magic_login_tokens',
    'push_subscriptions',
    'helper_last_login',
    'phone_verifications',
    'line_links',
    'wizard_analytics',
  ];
  for (const tbl of explicitTables) {
    const { error, count } = await supabase
      .from(tbl)
      .delete({ count: 'exact' })
      .eq('helper_ref', ref);
    if (error && !/(does not exist|relation .* does not exist|column .* does not exist)/i.test(error.message)) {
      console.log(`  ${tbl.padEnd(24)}  error: ${error.message}`);
    } else {
      console.log(`  ${tbl.padEnd(24)}  ${count ?? 0} row(s)`);
    }
  }

  // 4. The cascade chain: deleting helper_profiles + user_preferences
  //    triggers ON DELETE CASCADE on documents, helper_references,
  //    conversations, and via conversations, messages.
  for (const tbl of ['helper_profiles', 'user_preferences']) {
    const { error, count } = await supabase
      .from(tbl)
      .delete({ count: 'exact' })
      .eq('helper_ref', ref);
    if (error && !/(does not exist|relation .* does not exist)/i.test(error.message)) {
      console.log(`  ${tbl.padEnd(24)}  error: ${error.message}`);
    } else {
      console.log(`  ${tbl.padEnd(24)}  ${count ?? 0} row(s)  (cascades documents/references/conversations/messages)`);
    }
  }

  // 5. Confirm nothing is left.
  const { count: leftover } = await supabase
    .from('helper_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('helper_ref', ref);
  console.log(`\n  Verified: ${leftover} helper_profiles row(s) remain for ${ref}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
