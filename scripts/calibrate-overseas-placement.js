#!/usr/bin/env node
/**
 * Calibration for overseasPlacement() — lib/spam-signals.js.
 *
 * That rule suspends an account on a single message, which is the only rule
 * here that does. A rule like that is only defensible if somebody has looked
 * at what it would have done to every message ever sent on this platform, so
 * this script is how that number is produced and how it stays reproducible
 * after the regex is edited.
 *
 * It prints three groups:
 *
 *   WOULD SUSPEND    place of work abroad AND a document demand — the rule
 *   NEAR MISS        a foreign workplace, no document demand (not acted on)
 *   DOCUMENTS ONLY   a document demand with no foreign workplace (the old
 *                    alert's territory — families who travel, and the ones
 *                    that are only visible at volume)
 *
 * Read the near misses: that group is where a false positive would appear
 * first if the placement half of the rule is too loose.
 *
 *   node scripts/calibrate-overseas-placement.js
 *   node scripts/calibrate-overseas-placement.js --full   # whole messages
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

const full = process.argv.includes('--full');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  const { overseasPlacement, placementAbroad, documentRequestKind } = require('../lib/spam-signals');

  // Every employer message ever, paged past the 1000-row cap.
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('messages')
      .select('sender_ref, conversation_id, content_original, created_at')
      .eq('sender_type', 'employer')
      .order('created_at', { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  const refs = [...new Set(rows.map((r) => r.sender_ref))];
  const accounts = new Map();
  for (let i = 0; i < refs.length; i += 200) {
    const { data } = await supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, last_name, status')
      .in('employer_ref', refs.slice(i, i + 200));
    for (const a of data || []) accounts.set(a.employer_ref, a);
  }

  const groups = { suspend: new Map(), near: new Map(), docs: new Map() };
  for (const r of rows) {
    const text = r.content_original || '';
    const hit = overseasPlacement(text);
    const abroad = placementAbroad(text);
    const docs = documentRequestKind(text);
    // suspend = both halves. near = the alert-only half (job abroad, no
    // document demand). docs = a document demand with no job abroad.
    const target = hit ? 'suspend' : abroad ? 'near' : docs ? 'docs' : null;
    if (!target) continue;
    if (!groups[target].has(r.sender_ref)) groups[target].set(r.sender_ref, []);
    groups[target].get(r.sender_ref).push({ ...r, hit });
  }

  const show = (title, map) => {
    console.log(`\n${'='.repeat(72)}\n${title}: ${map.size} account(s)\n${'='.repeat(72)}`);
    for (const [ref, msgs] of [...map.entries()].sort((a, b) => b[1].length - a[1].length)) {
      const a = accounts.get(ref);
      const convs = new Set(msgs.map((m) => m.conversation_id)).size;
      console.log(`\n${ref}  ${a ? `${a.first_name} ${a.last_name}` : '?'}  [${a?.status || '?'}]`
        + `  ${msgs.length} message(s), ${convs} conversation(s)`);
      if (msgs[0].hit) console.log(`  rule: place="${msgs[0].hit.place}" documents=${msgs[0].hit.documents}`);
      const text = (msgs[0].content_original || '').replace(/\s+/g, ' ');
      console.log(`  ${msgs[0].created_at.slice(0, 10)}  ${full ? text : text.slice(0, 260)}`);
    }
  };

  console.log(`Corpus: ${rows.length} employer messages, ${refs.length} accounts.`);
  show('WOULD SUSPEND', groups.suspend);
  show('WOULD ALERT ONLY (job abroad, no document demand)', groups.near);
  console.log(`\n${'='.repeat(72)}\nDOCUMENTS ONLY (no foreign workplace): ${groups.docs.size} account(s)`);
  for (const [ref, msgs] of [...groups.docs.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const a = accounts.get(ref);
    console.log(`  ${ref}  ${a ? `${a.first_name} ${a.last_name}` : '?'}  [${a?.status || '?'}]  ${msgs.length} msg(s)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
