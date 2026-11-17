#!/usr/bin/env node
/**
 * Who invited whom: helpers who signed up through an "invite a friend" link
 * (components/InviteFriendCard.jsx), grouped by the helper who sent it.
 *
 *   node scripts/invite-report.js
 *
 * A signup through such a link is stored with source "invite/<code>". The
 * code is a keyed hash of the inviter's ref (lib/invite-code.js), so the only
 * way back to the inviter is to compute the code for every helper — which is
 * what this does. Read-only.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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
const envFile = findEnvFile();
if (envFile) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Keep in sync with lib/invite-code.js.
const codeFor = (ref) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(`invite:${ref}`).digest('hex').slice(0, 8);

// Supabase caps a select at 1000 rows, so page through.
async function allHelpers() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, city, nationality, source, email_verified, created_at')
      .order('created_at', { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

(async () => {
  const helpers = await allHelpers();
  const byCode = new Map(helpers.map((h) => [codeFor(h.helper_ref), h]));
  const invited = helpers.filter((h) => (h.source || '').startsWith('invite'));

  console.log(`${invited.length} Anmeldungen über Einladungslinks (von ${helpers.length} Helfern)\n`);
  const groups = new Map();
  for (const h of invited) {
    const code = h.source.split('/')[1] || '';
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(h);
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [code, list] of sorted) {
    const inviter = byCode.get(code);
    const who = inviter ? `${inviter.first_name} (${inviter.helper_ref}, ${inviter.city})` : `unbekannt [${code || 'ohne Code'}]`;
    console.log(`${list.length}×  eingeladen von ${who}`);
    for (const h of list) {
      console.log(`     ${h.created_at.slice(0, 10)}  ${h.first_name}  ${h.city || '-'}  ${h.nationality || '-'}  ${h.email_verified ? 'verifiziert' : 'unverifiziert'}`);
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
