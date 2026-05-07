/**
 * Admin script: delete a helper account (and all related data) by email.
 *
 * Usage:
 *   node scripts/delete-helper-account.js <email>             # dry run — shows what would be deleted
 *   node scripts/delete-helper-account.js <email> --confirm   # actually deletes
 *
 * Wipes from Supabase:
 *   - helper_profiles           (the profile row)
 *   - user_preferences          (cascades → documents, helper_references, conversations, messages)
 *   - helper_favorites          (any employer who favorited this helper)
 *   - push_subscriptions        (all devices this helper registered)
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const email = (process.argv[2] || '').trim().toLowerCase();
const confirm = process.argv.includes('--confirm');

if (!email) {
  console.error('Usage: node scripts/delete-helper-account.js <email> [--confirm]');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  console.log(`\n🔍 Looking up helper: ${email}\n`);

  const { data: profile, error: pErr } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, last_name, email, city, category, created_at')
    .eq('email', email)
    .maybeSingle();

  if (pErr) {
    console.error('Lookup error:', pErr.message);
    process.exit(1);
  }
  if (!profile) {
    console.log('No helper_profiles row found for that email. Nothing to delete.');
    process.exit(0);
  }

  const ref = profile.helper_ref;
  console.log('Found:', profile);
  console.log(`\nhelper_ref: ${ref}\n`);

  const counts = {};
  for (const [label, q] of [
    ['user_preferences', supabase.from('user_preferences').select('*', { count: 'exact', head: true }).eq('helper_ref', ref)],
    ['documents', supabase.from('documents').select('*', { count: 'exact', head: true }).eq('helper_ref', ref)],
    ['helper_references', supabase.from('helper_references').select('*', { count: 'exact', head: true }).eq('helper_ref', ref)],
    ['conversations', supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('helper_ref', ref)],
    ['helper_favorites', supabase.from('helper_favorites').select('*', { count: 'exact', head: true }).eq('helper_ref', ref)],
    ['push_subscriptions', supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }).eq('user_role', 'helper').eq('user_ref', ref)],
  ]) {
    const { count, error } = await q;
    counts[label] = error ? `err: ${error.message}` : (count ?? 0);
  }
  console.log('Related rows:', counts, '\n');

  if (!confirm) {
    console.log('ℹ️  Dry run — nothing deleted. Re-run with --confirm to actually delete.');
    process.exit(0);
  }

  console.log('🗑  Deleting…');

  // Cascade path: deleting user_preferences removes documents, helper_references,
  // conversations (and messages via conversations.id cascade).
  const steps = [
    ['user_preferences', supabase.from('user_preferences').delete().eq('helper_ref', ref)],
    ['helper_favorites', supabase.from('helper_favorites').delete().eq('helper_ref', ref)],
    ['push_subscriptions', supabase.from('push_subscriptions').delete().eq('user_role', 'helper').eq('user_ref', ref)],
    ['helper_profiles', supabase.from('helper_profiles').delete().eq('email', email)],
  ];
  for (const [label, q] of steps) {
    const { error } = await q;
    if (error) {
      console.error(`  ✗ ${label}: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ ${label}`);
  }

  console.log(`\n✅ Deleted helper ${email} (${ref}) and all related data.\n`);
})();
