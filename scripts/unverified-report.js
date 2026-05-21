#!/usr/bin/env node
/**
 * Admin report: list helpers who registered in the last N days and haven't
 * verified their email yet. Default window: 7 days.
 *
 *   node scripts/unverified-report.js          # last 7 days
 *   node scripts/unverified-report.js 14       # last 14 days
 *
 * Employers/families are intentionally excluded — they actively use their
 * email and verify on the initial confirmation. See memory note
 * `feedback_verify_reminders_helpers_only.md`. The helper list is what
 * Jelena typically wants to manually flip `email_verified = true` on.
 */
const path = require('path');
const fs = require('fs');

// Walk up from this file looking for .env.local — works whether the script
// runs from the main project checkout or from a .claude/worktrees/ copy.
function findEnvFile() {
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, '.env.local');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const envPath = findEnvFile();
if (envPath) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) return;
    const [, k, raw] = m;
    if (!process.env[k]) process.env[k] = raw.replace(/^['"]|['"]$/g, '');
  });
} else {
  console.error('Could not find .env.local — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const days = parseInt(process.argv[2] || '7', 10);
const since = new Date(Date.now() - days * 86400_000).toISOString();

(async () => {
  const { data: helpers, error: hErr } = await sb
    .from('helper_profiles')
    .select('first_name, last_name, email, category, city, created_at, email_verified')
    .eq('email_verified', false)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (hErr) console.error('helpers err:', hErr.message);

  // NOTE: we deliberately don't list unverified employers/families here.
  // They actively use their email and verify on the initial confirmation
  // if they want to — chasing them is unwanted. See memory:
  // feedback_verify_reminders_helpers_only.md
  console.log(`\n=== UNVERIFIED HELPERS in last ${days} days (since ${since.slice(0,10)}) ===\n`);
  console.log(`Count: ${helpers?.length ?? 0}\n`);

  if (helpers?.length) {
    helpers.forEach(h => {
      const d = h.created_at.slice(0,10);
      console.log(`  ${d}  ${h.first_name} ${h.last_name || ''}  <${h.email}>  ${h.category || '?'} · ${h.city || '?'}`);
    });
  }
})();
