#!/usr/bin/env node
/**
 * Audit recent employer signups for evidence they're actually helpers
 * (job seekers) who chose the wrong path during registration.
 *
 * Heuristics that flag a row as likely-mis-classified:
 *   - bio/needs text contains "looking for", "need a job", "I am a nanny",
 *     Thai equivalents (มองหางาน, หางาน, รับเลี้ยง, แม่บ้าน), Filipino/
 *     Burmese fragments, etc.
 *   - rate/salary text reads like a wage expectation, not a willingness
 *     to pay
 *   - name fields contain job-title language
 *
 * Usage:  node scripts/audit-employer-signups.js [days=14]
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

// Phrases that strongly suggest the writer wants to BE hired, not to hire.
const HELPER_SIGNALS = [
  // English
  'looking for a job', 'looking for work', 'looking for job', 'i am a nanny',
  'i am nanny', 'i am housekeeper', 'i am a housekeeper', 'i am a maid',
  'i can work', 'i want to work', 'i would like to work', 'available for work',
  'experience as', 'years of experience', 'i have experience',
  'pls hire me', 'please hire me', 'hire me', 'apply for',
  'i am cook', 'i am a cook', 'i am driver', 'i am a driver',
  'i am caregiver', 'i am a caregiver', 'i am tutor', 'i am a tutor',
  'salary expect', 'expected salary', 'my salary',
  'job seeker', 'jobseeker',
  // Thai
  'หางาน', 'มองหางาน', 'อยากทำงาน', 'รับสมัคร', 'พี่เลี้ยง',
  'แม่บ้าน', 'พ่อครัว', 'คนขับรถ', 'ผู้ดูแล',
  // Filipino / Tagalog
  'maghahanap ng trabaho', 'naghahanap ng trabaho',
  // Burmese
  'အလုပ်ရှာ',
];

function flag(rec) {
  // Scan every free-text field an employer could have typed a job-seeker
  // pitch into. The real schema uses `job_description` + `looking_for`
  // (NOT bio/needs/description), so those must be included or the audit
  // silently flags nothing.
  const text = [
    rec.job_description, rec.looking_for, rec.needed_skills,
    rec.bio, rec.needs, rec.description, rec.hiring_for,
    rec.first_name, rec.last_name,
  ].filter(Boolean).join(' ').toLowerCase();
  if (!text) return null;
  for (const sig of HELPER_SIGNALS) {
    if (text.includes(sig.toLowerCase())) return sig;
  }
  return null;
}

async function main() {
  const days = Number(process.argv[2] || 14);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Pull all columns so we don't miss a free-text field. Schemas evolve.
  const { data: rows, error } = await supabase
    .from('employer_accounts')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!rows || rows.length === 0) { console.log('No employer signups in window.'); return; }

  console.log(`Examining ${rows.length} employer signup(s) from the last ${days} day(s).`);
  console.log(`Available columns: ${Object.keys(rows[0]).join(', ')}`);
  console.log('');

  const suspect = [];
  const clean = [];
  for (const r of rows) {
    const sig = flag(r);
    if (sig) suspect.push({ row: r, signal: sig });
    else clean.push(r);
  }

  console.log(`SUSPECT (likely mis-classified helpers): ${suspect.length}`);
  console.log('─'.repeat(72));
  for (const { row, signal } of suspect) {
    const age = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000);
    console.log(`  ${row.employer_ref}  ${(row.first_name + ' ' + (row.last_name || '')).padEnd(24).slice(0, 24)}  ${(row.email || '').padEnd(34).slice(0, 34)}  ${age}d`);
    console.log(`    matched: "${signal}"`);
    for (const fld of ['job_description', 'looking_for', 'needed_skills', 'bio', 'needs', 'description', 'hiring_for']) {
      if (row[fld]) console.log(`    ${fld}: ${String(row[fld]).slice(0, 200).replace(/\s+/g, ' ')}`);
    }
    console.log('');
  }

  console.log(`\nLEGIT employer signups (no helper-signal in text): ${clean.length}`);
  console.log('─'.repeat(72));
  for (const row of clean) {
    const age = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000);
    console.log(`  ${row.employer_ref}  ${(row.first_name + ' ' + (row.last_name || '')).padEnd(24).slice(0, 24)}  ${(row.email || '').padEnd(34).slice(0, 34)}  ${age}d`);
    for (const fld of ['job_description', 'looking_for', 'needed_skills', 'bio', 'needs', 'description', 'hiring_for']) {
      if (row[fld]) console.log(`    ${fld}: ${String(row[fld]).slice(0, 200).replace(/\s+/g, ' ')}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
