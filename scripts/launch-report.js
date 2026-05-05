#!/usr/bin/env node
/**
 * Launch report — current snapshot of helpers vs. employers, broken
 * down by city and registration month. Used to decide when to switch
 * marketing focus from supply (helpers) to demand (employers).
 *
 * Usage:  node scripts/launch-report.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) return;
      const [, k, raw] = m;
      if (!process.env[k]) process.env[k] = raw.replace(/^['"]|['"]$/g, '');
    });
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function fmtMonth(d) {
  return new Date(d).toISOString().slice(0, 7); // YYYY-MM
}

function bucketByCity(rows) {
  const map = {};
  for (const r of rows) {
    const city = (r.city || 'unknown').toLowerCase().trim() || 'unknown';
    map[city] = (map[city] || 0) + 1;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function bucketByMonth(rows) {
  const map = {};
  for (const r of rows) {
    if (!r.created_at) continue;
    const m = fmtMonth(r.created_at);
    map[m] = (map[m] || 0) + 1;
  }
  return Object.entries(map).sort();
}

(async () => {
  // Helpers — pull all rows.
  const { data: helpers, error: hErr } = await supabase
    .from('helper_profiles')
    .select('helper_ref, city, status, email_verified, created_at');
  if (hErr) { console.error('Helpers query failed:', hErr); process.exit(1); }

  // Employers — pull all rows.
  const { data: employers, error: eErr } = await supabase
    .from('employer_accounts')
    .select('employer_ref, city, email_verified, created_at');
  if (eErr) { console.error('Employers query failed:', eErr); process.exit(1); }

  const activeHelpers   = helpers.filter(h => h.status !== 'inactive' && h.status !== 'deleted');
  const verifiedHelpers = activeHelpers.filter(h => h.email_verified === true);
  const verifiedEmployers = (employers || []).filter(e => e.email_verified === true);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ThaiHelper — Launch Report');
  console.log(`  Generated ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('OVERVIEW');
  console.log(`  Helper accounts (any status):     ${helpers.length}`);
  console.log(`  Helper accounts (active):         ${activeHelpers.length}`);
  console.log(`  Helper accounts (verified):       ${verifiedHelpers.length}`);
  console.log(`  Employer accounts (any):          ${employers?.length || 0}`);
  console.log(`  Employer accounts (verified):     ${verifiedEmployers.length}`);
  console.log(`  Helper:Employer ratio:            ${
    verifiedEmployers.length > 0
      ? (verifiedHelpers.length / verifiedEmployers.length).toFixed(1) + ':1'
      : 'no employers yet'
  }\n`);

  console.log('HELPERS BY CITY (verified only)');
  for (const [city, n] of bucketByCity(verifiedHelpers)) {
    const bar = '█'.repeat(Math.min(n, 40));
    console.log(`  ${city.padEnd(20)} ${String(n).padStart(3)} ${bar}`);
  }

  if (verifiedEmployers.length > 0) {
    console.log('\nEMPLOYERS BY CITY (verified only)');
    for (const [city, n] of bucketByCity(verifiedEmployers)) {
      const bar = '█'.repeat(Math.min(n, 40));
      console.log(`  ${city.padEnd(20)} ${String(n).padStart(3)} ${bar}`);
    }
  }

  console.log('\nHELPERS BY MONTH (any status)');
  for (const [m, n] of bucketByMonth(helpers)) {
    const bar = '█'.repeat(Math.min(n, 40));
    console.log(`  ${m}  ${String(n).padStart(3)} ${bar}`);
  }

  if ((employers?.length || 0) > 0) {
    console.log('\nEMPLOYERS BY MONTH (any status)');
    for (const [m, n] of bucketByMonth(employers)) {
      const bar = '█'.repeat(Math.min(n, 40));
      console.log(`  ${m}  ${String(n).padStart(3)} ${bar}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
})();
