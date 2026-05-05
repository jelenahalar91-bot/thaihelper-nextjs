#!/usr/bin/env node
/**
 * Quick check: does the helper_profiles.nationality column exist,
 * and is it populated for the helpers we previously marked as
 * thai_national?
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
  { auth: { persistSession: false, autoRefreshToken: false } }
);

(async () => {
  const { data, error } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, work_permit_status, nationality')
    .limit(5);

  if (error) {
    console.error('\n❌ Query error:', error.message);
    if (error.message.includes('column') && error.message.includes('nationality')) {
      console.error('\n→ The `nationality` column does NOT exist yet.');
      console.error('  Run scripts/supabase-nationality.sql in your Supabase SQL editor first.');
    }
    process.exit(1);
  }

  console.log('\n✓ `nationality` column exists.\n');
  console.log('Sample:');
  data.forEach(h => {
    console.log(`  ${h.helper_ref}  ${h.first_name?.padEnd(20)}  wp=${(h.work_permit_status || '—').padEnd(15)}  nat=${h.nationality || '—'}`);
  });

  const { data: thai } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, last_name, nationality, work_permit_status')
    .eq('nationality', 'thai');

  const { data: wpThai } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, last_name, nationality, work_permit_status')
    .eq('work_permit_status', 'thai_national');

  console.log(`\nHelpers with nationality='thai':              ${thai?.length || 0}`);
  console.log(`Helpers with work_permit_status='thai_national': ${wpThai?.length || 0}`);

  if ((thai?.length || 0) === 0 && (wpThai?.length || 0) > 0) {
    console.log('\n→ Backfill UPDATE in the migration probably hasn\'t run.');
    console.log('  Re-run scripts/supabase-nationality.sql — the UPDATE block at the bottom is idempotent.');
  } else if ((thai?.length || 0) > 0) {
    console.log('\n✓ /helpers?nationality=thai will return these helpers.');
  }
})();
