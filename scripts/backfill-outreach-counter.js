#!/usr/bin/env node
/**
 * Seed the 'outreach-sent' counter from history.
 *
 * On 2026-09-28 an outreach event stopped being "a conversation row was
 * created" and became "a first message was sent" (see lib/spam-signals.js).
 * The new counter lives in a new bucket, because the old rows mean something
 * else — 31% of them are empty threads nobody was ever reached through.
 *
 * Without this script the new bucket starts empty, so for the first 30 days
 * after the deploy the 30-day cap counts from zero for everybody, including an
 * account halfway through a spray. This replays the real events instead: one
 * row per conversation whose FIRST message was sent by that account, timed to
 * when that message was sent, for the last 30 days.
 *
 * Idempotent: refuses to run twice by checking whether the bucket already
 * holds rows in the window.
 *
 *   node scripts/backfill-outreach-counter.js --dry-run
 *   node scripts/backfill-outreach-counter.js
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

const BUCKET = 'outreach-sent';
const WINDOW_DAYS = 30;
const ALERT = 30;
const dryRun = process.argv.includes('--dry-run');

// Supabase caps a select at 1000 rows and says nothing about it.
async function page(table, select, apply) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    let q = supabase.from(table).select(select).order('created_at', { ascending: true }).range(from, from + 999);
    if (apply) q = apply(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

async function main() {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { count: already } = await supabase
    .from('rate_limit_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('bucket', BUCKET)
    .gt('created_at', since);
  if (already) {
    console.error(`${BUCKET} already holds ${already} rows in the window — refusing to double-count.`);
    process.exit(1);
  }

  // Every conversation that could still have its first message inside the
  // window. A thread created earlier can have been opened later, so the filter
  // is on the message, not on the conversation.
  const convs = await page('conversations', 'id, helper_ref, employer_id, created_at');
  const first = new Map();
  const ids = convs.map((c) => c.id);
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id, sender_type, sender_ref, created_at')
      .in('conversation_id', ids.slice(i, i + 100))
      .order('created_at', { ascending: true });
    if (error) throw new Error(`messages: ${error.message}`);
    for (const m of data) {
      const prev = first.get(m.conversation_id);
      if (!prev || m.created_at < prev.created_at) first.set(m.conversation_id, m);
    }
  }

  const rows = [];
  const tally = new Map();
  for (const c of convs) {
    const f = first.get(c.id);
    if (!f || f.created_at <= since) continue;
    const key = f.sender_ref || (f.sender_type === 'helper' ? c.helper_ref : c.employer_id);
    if (!key) continue;
    rows.push({ bucket: BUCKET, key, created_at: f.created_at });
    tally.set(key, (tally.get(key) || 0) + 1);
  }

  const top = [...tally].sort((a, b) => b[1] - a[1]);
  console.log(`${rows.length} outreach events in the last ${WINDOW_DAYS} days, across ${tally.size} accounts.`);
  console.log('Busiest:');
  for (const [key, n] of top.slice(0, 10)) {
    console.log(`  ${key.padEnd(12)} ${String(n).padStart(3)}${n + 1 >= ALERT ? '   ← would alert on its next one' : ''}`);
  }
  const overAlert = top.filter(([, n]) => n + 1 >= ALERT).length;
  console.log(overAlert
    ? `\n${overAlert} account(s) would alert on their next first message.`
    : '\nNo account is near the alert threshold — the deploy sends no mail.');

  if (dryRun) { console.log('\n--dry-run: nothing written.'); return; }

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('rate_limit_attempts').insert(rows.slice(i, i + 500));
    if (error) { console.error('Insert failed:', error.message); process.exit(1); }
  }
  console.log(`\nWrote ${rows.length} rows to ${BUCKET}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
