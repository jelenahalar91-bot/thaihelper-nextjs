#!/usr/bin/env node
/**
 * Tell families that the profile they messaged was a duplicate and is now closed.
 *
 * Audience is DERIVED, not typed: every family holding an unread message on a
 * helper profile whose status is 'closed' with a status_reason beginning
 * "Duplicate of". Typing refs by hand is how somebody gets missed — Sean was
 * the obvious case, but the same query turned up Sunil, who had written ten
 * times into two different dead profiles and had no live thread with either.
 *
 * Whether she has a LIVE thread with that family decides the closing line, so
 * it is looked up per recipient rather than assumed: "continue in that thread"
 * is wrong for a family that has never reached her.
 *
 * SAFETY: dry-run is the DEFAULT. Nothing is sent without --live.
 * Deduplicated per (family, closed profile) in
 * scripts/.duplicate-profile-notice-sent.jsonl, so an interrupted run resumes
 * and nobody is written to twice about the same profile.
 *
 * Usage:
 *   node scripts/send-duplicate-profile-notice.mjs                       # dry-run: list everyone
 *   node scripts/send-duplicate-profile-notice.mjs --only=EMP-SMLHSP     # restrict to one family
 *   node scripts/send-duplicate-profile-notice.mjs --preview             # render the mail
 *   node scripts/send-duplicate-profile-notice.mjs --only=EMP-SMLHSP --live   # SENDS
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { buildDuplicateProfileNotice, sendDuplicateProfileNotice } from '../lib/emails/duplicate-profile-notice.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}

const args = process.argv.slice(2);
const live = args.includes('--live');
const preview = args.includes('--preview');
const only = (args.find((a) => a.startsWith('--only='))?.slice(7) || '').trim().toUpperCase();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const LOG = path.join(__dirname, '.duplicate-profile-notice-sent.jsonl');
const sent = new Set(
  fs.existsSync(LOG)
    ? fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean)
        .map((l) => { const r = JSON.parse(l); return `${r.employer_ref}|${r.helper_ref}`; })
    : []
);

const { data: closed } = await supabase
  .from('helper_profiles')
  .select('helper_ref, first_name, date_of_birth, status_reason')
  .eq('status', 'closed')
  .like('status_reason', 'Duplicate of %');

if (!closed?.length) { console.log('No closed duplicate profiles.'); process.exit(0); }

const rows = [];
for (const dup of closed) {
  const { data: convs } = await supabase
    .from('conversations').select('id, employer_id').eq('helper_ref', dup.helper_ref);
  for (const c of convs || []) {
    const { data: msgs } = await supabase
      .from('messages').select('sender_type, is_read').eq('conversation_id', c.id);
    const unread = (msgs || []).filter((m) => m.sender_type === 'employer' && !m.is_read).length;
    if (!unread) continue;

    const { data: emp } = await supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, email, email_verified, status')
      .eq('employer_ref', c.employer_id).maybeSingle();
    // Never mail an account staff have stopped, and never an unverified
    // address — same rule as every other outgoing mail here.
    if (!emp?.email || emp.status === 'suspended' || !emp.email_verified) continue;
    if (only && emp.employer_ref !== only) continue;
    if (sent.has(`${emp.employer_ref}|${dup.helper_ref}`)) { console.log(`skip (already sent) ${emp.employer_ref} / ${dup.helper_ref}`); continue; }

    // The surviving twin: same person (date of birth), still active.
    const { data: twins } = await supabase
      .from('helper_profiles').select('helper_ref')
      .eq('date_of_birth', dup.date_of_birth).eq('status', 'active');
    let hasLiveThread = false;
    for (const t of twins || []) {
      const { data: live2 } = await supabase
        .from('conversations').select('id').eq('helper_ref', t.helper_ref).eq('employer_id', emp.employer_ref);
      if (live2?.length) { hasLiveThread = true; break; }
    }

    rows.push({
      employer_ref: emp.employer_ref, firstName: emp.first_name, email: emp.email,
      helper_ref: dup.helper_ref, helperName: (dup.first_name || '').split(' (')[0],
      messageCount: unread, hasLiveThread,
    });
  }
}

if (!rows.length) { console.log('Nobody to write to.'); process.exit(0); }

console.log(`\n${rows.length} famil${rows.length === 1 ? 'y' : 'ies'}:\n`);
for (const r of rows) {
  console.log(`  ${r.employer_ref}  ${r.firstName}  <${r.email}>  → ${r.helper_ref} (${r.helperName}), ${r.messageCount} unread, live thread: ${r.hasLiveThread ? 'yes' : 'no'}`);
}
console.log();

if (preview) {
  const m = buildDuplicateProfileNotice(rows[0]);
  console.log(`Subject: ${m.subject}\n\n${m.text}\n`);
}

if (!live) { console.log('[dry-run] nothing sent. Add --live to send.'); process.exit(0); }

for (const r of rows) {
  try {
    await sendDuplicateProfileNotice(r);
    fs.appendFileSync(LOG, JSON.stringify({ ...r, at: new Date().toISOString() }) + '\n');
    console.log(`sent → ${r.email}`);
  } catch (e) {
    console.error(`FAILED ${r.email}:`, e.message);
  }
}
