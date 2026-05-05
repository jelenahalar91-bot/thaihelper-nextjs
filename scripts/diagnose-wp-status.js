#!/usr/bin/env node
/**
 * Diagnose: how many existing helpers have a work_permit_status set,
 * and what languages do the unset ones speak? If most of them only
 * speak Thai, they're almost certainly Thai nationals — we can offer
 * them a one-click "yes, I'm Thai" flow, or a careful heuristic
 * backfill from the language data.
 *
 * Usage:  node scripts/diagnose-wp-status.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) return;
      if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const FOREIGN_LANGUAGES = ['burmese', 'khmer', 'lao', 'tagalog', 'vietnamese', 'russian', 'german', 'chinese'];

(async () => {
  const { data: helpers, error } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, last_name, languages, work_permit_status, status, email_verified')
    .eq('email_verified', true);
  if (error) { console.error(error); process.exit(1); }

  console.log(`Verified helpers: ${helpers.length}\n`);

  const byStatus = {};
  for (const h of helpers) {
    const s = h.work_permit_status || '(unset)';
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  console.log('Current work_permit_status distribution:');
  for (const [k, n] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${n}`);
  }

  // Heuristic categorisation of unset helpers based on languages.
  const unset = helpers.filter(h => !h.work_permit_status);
  const thaiOnly = [];
  const thaiPlusForeign = [];
  const noThai = [];

  for (const h of unset) {
    const langs = (h.languages || '').toLowerCase().split(/[,;\s]+/).filter(Boolean);
    const hasThai = langs.some(l => l.includes('thai'));
    const hasForeign = langs.some(l => FOREIGN_LANGUAGES.some(f => l.includes(f)));
    if (hasThai && !hasForeign) thaiOnly.push(h);
    else if (hasThai && hasForeign) thaiPlusForeign.push(h);
    else noThai.push(h);
  }

  console.log(`\nOf the ${unset.length} unset helpers:`);
  console.log(`  ${thaiOnly.length.toString().padStart(3)} speak Thai but no foreign language → almost certainly Thai national`);
  console.log(`  ${thaiPlusForeign.length.toString().padStart(3)} speak Thai + a foreign language → could be Thai (bilingual) OR foreign with Thai skills`);
  console.log(`  ${noThai.length.toString().padStart(3)} speak no Thai at all → definitely not Thai national`);

  if (noThai.length > 0) {
    console.log('\nSample of "no Thai" helpers (these we should NOT mark as Thai national):');
    noThai.slice(0, 5).forEach(h =>
      console.log(`  ${h.helper_ref}  ${h.first_name} ${h.last_name?.[0] || ''}.  langs: "${h.languages}"`)
    );
  }

  console.log('\nRecommendation:');
  console.log(`  - Backfill the ${thaiOnly.length} "Thai-only" helpers as work_permit_status='thai_national'`);
  console.log(`  - Send a one-click email/LINE prompt to the ${thaiPlusForeign.length} bilingual helpers asking them to confirm`);
  console.log(`  - Leave the ${noThai.length} foreign-language helpers untouched`);
})();
