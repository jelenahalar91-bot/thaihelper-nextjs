#!/usr/bin/env node
/**
 * Close a duplicate helper profile — manual moderation tool.
 *
 * NOT scripts/suspend-account.js, and the difference is the whole point. A
 * second profile is not abuse. Suspending one would block the login, kill any
 * live session, refuse replies in conversations the person is already having,
 * and put an abuse label on somebody whose only mistake was not finding a
 * verification mail. 'closed' does none of that: lib/access.js lists it in
 * UNLISTED_STATUSES, so the listing disappears from /helpers, the homepage
 * panels, favourites, match digests and reminder mails — and pages/api/auth.js
 * only refuses 'suspended', so she keeps her login, her dashboard and every
 * thread she is in.
 *
 * Why duplicates happen: somebody doesn't find the verification mail and just
 * registers again. Found 2026-10-26 on three helpers at once (TH-F21CBP,
 * TH-TUWYMU, TH-BNOIJS). It is not cosmetic. The abandoned profile keeps
 * collecting messages nobody reads — 7 unread on one of them — and families
 * cannot tell the two cards apart: two of them favourited BOTH of Thapach's
 * profiles within a minute, and one family was arranging a video call on the
 * live profile while writing a fresh "I saw your profile" to the dead one.
 *
 * WHICH ONE SURVIVES is the one with the conversations on it, not the one
 * registered first. Re-pointing conversations.helper_ref would work, but it
 * rewrites history that families can see, for no gain.
 *
 * MERGE CONTENT BY HAND FIRST, and only where the survivor is actually poorer.
 * On TH-F21CBP the dead profile held her own bio and the survivor held the
 * auto-text from pages/register.js:795 — that was worth moving, along with a
 * category and three certificates. On the other two the survivor is the
 * profile she actively maintains, and "merging" would have meant putting her
 * back into searches she had left. This script deliberately moves nothing:
 * copy what is worth copying before you run it.
 *
 * Certificates move with a plain helper_ref update — the file stays where it
 * is, because signed URLs are built from storage_path
 * (pages/api/helper-documents.js), so nothing has to be re-uploaded.
 *
 * Needs scripts/supabase-helper-status-closed.sql. Until that ran,
 * helper_profiles.status rejected 'closed' outright: supabase-account-status.sql
 * declared the value for both tables in September, but ADD COLUMN IF NOT EXISTS
 * silently skipped helper_profiles — the column was already there, with the
 * older CHECK — so the code believed in a state the database refused.
 *
 * The previous values are appended to scripts/.closed-duplicates.jsonl before
 * anything is written, and --restore replays them.
 *
 * Usage:
 *   node scripts/close-duplicate-profile.js TH-TUWYMU --duplicate-of TH-XQLZ6T --reason "..."
 *   node scripts/close-duplicate-profile.js TH-TUWYMU --duplicate-of TH-XQLZ6T --dry-run
 *   node scripts/close-duplicate-profile.js TH-TUWYMU --restore
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const LOG = path.join(__dirname, '.closed-duplicates.jsonl');
const FIELDS = 'helper_ref, first_name, last_name, email, date_of_birth, city, status, status_reason, status_changed_at';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
}

async function load(ref) {
  const { data, error } = await supabase
    .from('helper_profiles').select(FIELDS).eq('helper_ref', ref).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * How many messages would stop being read if this profile goes quiet, and how
 * many the person actually sent from it. A profile she is writing from is not
 * a duplicate to close — it is two live profiles, which is a conversation to
 * have with her, not a database edit.
 */
async function activity(ref) {
  const { data: convs } = await supabase
    .from('conversations').select('id').eq('helper_ref', ref);
  const ids = (convs || []).map((c) => c.id);
  if (!ids.length) return { convs: 0, sent: 0, lastSent: '', unread: 0 };
  const { data: msgs } = await supabase
    .from('messages').select('sender_type, is_read, created_at').in('conversation_id', ids);
  const sent = (msgs || []).filter((m) => m.sender_type === 'helper');
  return {
    convs: ids.length,
    sent: sent.length,
    lastSent: sent.reduce((a, m) => (m.created_at > a ? m.created_at : a), ''),
    unread: (msgs || []).filter((m) => m.sender_type === 'employer' && !m.is_read).length,
  };
}

async function main() {
  const ref = process.argv[2];
  if (!ref || !/^TH-[A-Z0-9]+$/.test(ref)) {
    console.error('Usage: node scripts/close-duplicate-profile.js TH-XXXXXX --duplicate-of TH-YYYYYY --reason "..."');
    process.exit(1);
  }
  const dryRun = process.argv.includes('--dry-run');
  const restore = process.argv.includes('--restore');

  const row = await load(ref);
  if (!row) { console.error(`No helper with ref ${ref}`); process.exit(1); }

  if (restore) {
    const lines = fs.existsSync(LOG)
      ? fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
      : [];
    const prev = [...lines].reverse().find((l) => l.helper_ref === ref && l.action === 'close');
    if (!prev) { console.error(`Nothing logged for ${ref} — restore by hand.`); process.exit(1); }
    if (dryRun) { console.log('[dry-run] would restore', prev.before); return; }
    const { error } = await supabase.from('helper_profiles').update({
      status: prev.before.status,
      status_reason: prev.before.status_reason,
      status_changed_at: prev.before.status_changed_at,
      updated_at: new Date().toISOString(),
    }).eq('helper_ref', ref);
    if (error) throw error;
    fs.appendFileSync(LOG, JSON.stringify({ action: 'restore', helper_ref: ref, at: new Date().toISOString() }) + '\n');
    console.log(`Restored ${ref} to status=${prev.before.status}`);
    return;
  }

  const twin = arg('--duplicate-of');
  const reason = arg('--reason');
  if (!twin || !reason) {
    console.error('Both --duplicate-of TH-YYYYYY and --reason "..." are required.');
    process.exit(1);
  }
  const twinRow = await load(twin);
  if (!twinRow) { console.error(`No helper with ref ${twin}`); process.exit(1); }
  if (twinRow.status !== 'active') {
    console.error(`${twin} is status=${twinRow.status} — that is the profile meant to survive. Check the refs.`);
    process.exit(1);
  }

  const [mine, theirs] = await Promise.all([activity(ref), activity(twin)]);

  console.log(`\nClosing : ${ref}  ${row.first_name} ${row.last_name}  <${row.email}>  DOB ${row.date_of_birth || '—'}  ${row.city}`);
  console.log(`          ${mine.convs} conversations, ${mine.sent} sent by her${mine.lastSent ? ` (last ${mine.lastSent.slice(0, 10)})` : ""}, ${mine.unread} unread`);
  console.log(`Keeping : ${twin}  ${twinRow.first_name} ${twinRow.last_name}  <${twinRow.email}>  DOB ${twinRow.date_of_birth || '—'}  ${twinRow.city}`);
  console.log(`          ${theirs.convs} conversations, ${theirs.sent} sent by her${theirs.lastSent ? ` (last ${theirs.lastSent.slice(0, 10)})` : ''}, ${theirs.unread} unread\n`);

  if (!row.date_of_birth || row.date_of_birth !== twinRow.date_of_birth) {
    console.error('STOP: the two profiles do not share a date of birth. Same name is not evidence.');
    process.exit(1);
  }
  // Which profile is she WRITING FROM — by date, not by total. Totals get this
  // backwards on exactly the case this script is for: the abandoned profile is
  // the older one, so it has had longer to accumulate. Melanie Balbal sent 12
  // messages from the profile she left and 2 from the one she moved to, and a
  // total-count guard called that "closing the wrong one".
  if (mine.lastSent && mine.lastSent > theirs.lastSent) {
    console.error(`STOP: she wrote from ${ref} more recently (${mine.lastSent.slice(0, 10)}) than from ${twin} (${theirs.lastSent ? theirs.lastSent.slice(0, 10) : 'never'}). Either the refs are the wrong way round, or she is using both — ask her before closing either.`);
    process.exit(1);
  }
  if (mine.unread > 0) {
    console.log(`Note: ${mine.unread} unread family messages stay on the closed profile. They are not lost, but nobody is reading them — consider telling those families.`);
  }

  if (dryRun) { console.log('[dry-run] nothing written.'); return; }

  fs.appendFileSync(LOG, JSON.stringify({
    action: 'close', helper_ref: ref, duplicate_of: twin,
    at: new Date().toISOString(), before: row, activity: mine,
  }) + '\n');

  const { error } = await supabase.from('helper_profiles').update({
    status: 'closed',
    status_reason: `Duplicate of ${twin}. ${reason}`,
    status_changed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('helper_ref', ref);
  if (error) throw error;

  console.log(`${ref} closed. She keeps her login, her dashboard and her threads; the listing is gone.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
