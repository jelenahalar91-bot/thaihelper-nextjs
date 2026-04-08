/**
 * Admin script: grant / extend / revoke promo access for an employer.
 *
 * Usage:
 *   node scripts/grant-employer-access.js <email> [days] [tier]
 *
 * Arguments:
 *   email  (required) — employer's email address (case-insensitive)
 *   days   (optional) — how many days of access from NOW. Default: 56 (8 weeks)
 *                       Pass 0 to revoke access (sets access_until = null, tier = free)
 *   tier   (optional) — 'promo' | 'paid'. Default: 'promo'
 *
 * Examples:
 *   # Give jelenahalar91@gmail.com 8 weeks of promo access
 *   node scripts/grant-employer-access.js jelenahalar91@gmail.com
 *
 *   # Give someone 4 weeks
 *   node scripts/grant-employer-access.js test@example.com 28
 *
 *   # Mark as paid for 1 year
 *   node scripts/grant-employer-access.js customer@example.com 365 paid
 *
 *   # Revoke access
 *   node scripts/grant-employer-access.js abuse@example.com 0
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Load .env.local manually (matches migrate-sheets-to-supabase.js) ───
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#') && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

// ── Parse CLI args ─────────────────────────────────────────────────────
const [, , emailArg, daysArg, tierArg] = process.argv;

if (!emailArg) {
  console.error('\n❌ Missing email argument\n');
  console.error('Usage: node scripts/grant-employer-access.js <email> [days] [tier]');
  console.error('       days default = 56 (8 weeks)');
  console.error('       tier default = promo  (promo | paid)\n');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const days = daysArg !== undefined ? parseInt(daysArg, 10) : 56;
const tier = tierArg || 'promo';

if (Number.isNaN(days) || days < 0) {
  console.error(`❌ Invalid days value: "${daysArg}" — must be a non-negative integer`);
  process.exit(1);
}

if (!['promo', 'paid', 'free'].includes(tier)) {
  console.error(`❌ Invalid tier: "${tier}" — must be promo | paid | free`);
  process.exit(1);
}

// ── Build Supabase client (service role) ───────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Main ───────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n🔍 Looking up employer: ${email}`);

  const { data: employer, error: lookupErr } = await supabase
    .from('employer_accounts')
    .select('employer_ref, first_name, last_name, email, access_tier, access_until')
    .eq('email', email)
    .maybeSingle();

  if (lookupErr) {
    console.error('❌ Lookup failed:', lookupErr.message);
    process.exit(1);
  }

  if (!employer) {
    console.error(`❌ No employer found with email "${email}"`);
    process.exit(1);
  }

  console.log('\n── BEFORE ──────────────────────────────────');
  console.log(`  Ref:          ${employer.employer_ref}`);
  console.log(`  Name:         ${employer.first_name} ${employer.last_name || ''}`);
  console.log(`  Email:        ${employer.email}`);
  console.log(`  Current tier: ${employer.access_tier}`);
  console.log(`  Access until: ${employer.access_until || '(none)'}`);

  // Build update payload
  let update;
  if (days === 0) {
    // Revoke
    update = { access_tier: 'free', access_until: null };
    console.log('\n🚫 Revoking access…');
  } else {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    update = {
      access_tier: tier,
      access_until: expires.toISOString(),
    };
    console.log(`\n✨ Granting ${days} day(s) of "${tier}" access…`);
  }

  const { data: updated, error: updateErr } = await supabase
    .from('employer_accounts')
    .update(update)
    .eq('employer_ref', employer.employer_ref)
    .select('employer_ref, access_tier, access_until')
    .single();

  if (updateErr) {
    console.error('❌ Update failed:', updateErr.message);
    process.exit(1);
  }

  console.log('\n── AFTER ───────────────────────────────────');
  console.log(`  Ref:          ${updated.employer_ref}`);
  console.log(`  New tier:     ${updated.access_tier}`);
  console.log(`  Access until: ${updated.access_until || '(none)'}`);
  if (updated.access_until) {
    const daysLeft = Math.ceil(
      (new Date(updated.access_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    console.log(`  Days left:    ${daysLeft}`);
  }
  console.log('\n✅ Done. Tell the employer to reload their dashboard.\n');
})().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
