#!/usr/bin/env node
// One-off: restore helper_profiles row for TH-X9AYUC (Jiranan Khunsnong /
// jiranan18032554@gmail.com). The profile row was deleted but the
// related rows (user_preferences, documents, 4 active conversations,
// magic_login_tokens) survived — meaning the official delete script was
// NOT run; somebody hit `DELETE FROM helper_profiles WHERE …` directly.
//
// We have enough fragments to recreate a minimal, valid profile so she
// can log in again and message her 4 existing conversations. Bio, photo,
// city, category etc. she'll need to refill from her dashboard.
//
// Usage:
//   node scripts/restore-jiranan-profile.js              # dry-run
//   node scripts/restore-jiranan-profile.js --confirm

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const confirm = process.argv.includes('--confirm');

// Values reconstructed from residual data:
// - helper_ref, email          → magic_login_tokens + user_preferences
// - first_name, last_name      → reply email signature ("Jiranan Khunsnong")
// - created_at                 → user_preferences.created_at
// - email_verified / _at       → magic-link login succeeded, so verified
// - last_login_at              → most recent used token (2026-06-07)
// - status                     → 'active'
// Everything else: defaults / null. She'll repopulate from the dashboard.
const row = {
  helper_ref: 'TH-X9AYUC',
  email: 'jiranan18032554@gmail.com',
  first_name: 'Jiranan',
  last_name: 'Khunsnong',
  status: 'active',
  email_verified: true,
  email_verified_at: '2026-06-02T23:43:00.000+00:00',
  last_login_at: '2026-06-07T09:21:29.998+00:00',
  created_at: '2026-06-02T23:39:45.157+00:00',
  notify_on_message: true,
  notify_via_line: false,
  notify_via_whatsapp: false,
  has_whatsapp: false,
  nationality: 'thai',
  work_permit_status: 'thai_national',
  availability_status: 'available',
  // category is NOT NULL. Seed with a sensible default — the TH-MGVBTE
  // duplicate had "driver, nanny, chef, housekeeper, petsitter, elder_care"
  // for the same person, so use the same. She can narrow it in the dashboard.
  category: 'driver, nanny, chef, housekeeper, petsitter, elder_care',
  city: 'phuket',
};

(async () => {
  // Safety check: confirm the row really doesn't exist before inserting.
  const existing = await supabase
    .from('helper_profiles')
    .select('helper_ref')
    .or(`helper_ref.eq.${row.helper_ref},email.eq.${row.email}`);
  if (existing.error) {
    console.error('Pre-check failed:', existing.error.message);
    process.exit(1);
  }
  if (existing.data?.length) {
    console.log('Row already exists — nothing to do:', existing.data);
    process.exit(0);
  }

  console.log('Will insert:\n', row);

  if (!confirm) {
    console.log('\n[Dry run] Re-run with --confirm to actually insert.');
    process.exit(0);
  }

  const ins = await supabase.from('helper_profiles').insert(row).select().single();
  if (ins.error) {
    console.error('Insert failed:', ins.error.message);
    process.exit(1);
  }
  console.log('\n✓ Restored:');
  console.log(ins.data);
})();
