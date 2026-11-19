#!/usr/bin/env node
/**
 * Calibration for the contact-link alert — pages/api/messages.js, suppression
 * rule in lib/contact-invite.js.
 *
 * The alert mails the admin inbox whenever a FAMILY sends a tap-to-open
 * contact link. Since 2026-11-19 it stays quiet when the helper asked for the
 * handle first. Suppressing an alert is the one change here that can lose a
 * scam, so the rule is only defensible if somebody has looked at what it would
 * do to every link an employer has ever sent — this script is that look, and
 * it stays reproducible after the regexes are edited.
 *
 * It prints two groups:
 *
 *   WOULD STILL ALERT  the family sent the link unprompted — the mail goes out
 *   NOW SUPPRESSED     the helper opened the door first, quoting her words
 *                      and how far back they were
 *
 * Read the suppressed group against account status. A [suspended] account in
 * there is the failure this rule can cause: it means a confirmed scam said
 * something that reads as an invitation, and the regex needs tightening.
 *
 *   node scripts/calibrate-contact-link-alert.js
 *   node scripts/calibrate-contact-link-alert.js --full   # whole messages
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

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return full || t.length <= n ? t : `${t.slice(0, n)}…`;
};

async function main() {
  const { linkHandles } = require('../lib/contact-blocklist');
  const { helperOpenedTheDoor } = require('../lib/contact-invite');

  // Every message ever, paged past the 1000-row cap. The whole corpus is
  // needed, not just the employers': the suppression is decided by what the
  // HELPER said before the link.
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id, sender_type, sender_ref, content_original, content_translated, created_at')
      .order('created_at', { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  const threads = new Map();
  for (const r of rows) {
    if (!threads.has(r.conversation_id)) threads.set(r.conversation_id, []);
    threads.get(r.conversation_id).push(r);
  }

  // Every link an employer ever sent, in time order, so the spread half of
  // the rule can be replayed as it stood at that moment rather than as it
  // looks today — the first link of a spray had no predecessors either.
  const links = [];
  for (const [, msgs] of threads) {
    msgs.forEach((m, i) => {
      if (m.sender_type !== 'employer') return;
      const found = linkHandles(m.content_original || '');
      if (found.length) links.push({ ...m, links: found, before: msgs.slice(0, i) });
    });
  }
  links.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  const alert = new Map();
  const suppressed = new Map();
  const gaps = [];
  {
    links.forEach((m) => {
      const { before } = m;
      const asked = helperOpenedTheDoor(before);
      // linkSpread() as of this message: other conversations the same account
      // had already linked into within the window.
      const spread = new Set(
        links
          .filter((o) => o.sender_ref === m.sender_ref
            && o.conversation_id !== m.conversation_id
            && new Date(m.created_at) - new Date(o.created_at) > 0
            && new Date(m.created_at) - new Date(o.created_at) < WINDOW_MS)
          .map((o) => o.conversation_id)
      ).size;
      const invited = asked && spread === 0 ? asked : null;
      const target = invited ? suppressed : alert;
      if (!target.has(m.sender_ref)) target.set(m.sender_ref, []);
      target.get(m.sender_ref).push({ ...m, asked, spread, invited });
      if (invited) {
        // How far back the invitation was — the number CONTACT_LINK_HISTORY
        // has to clear, in messages and in minutes.
        const at = before.findIndex((b) => b.sender_type === 'helper'
          && [b.content_original, b.content_translated].some((t) => String(t || '').includes(invited.text.slice(0, 40))));
        if (at >= 0) {
          gaps.push({
            msgs: before.length - at,
            mins: Math.round((new Date(m.created_at) - new Date(before[at].created_at)) / 60000),
          });
        }
      }
    });
  }

  const refs = [...new Set([...alert.keys(), ...suppressed.keys()])];
  const accounts = new Map();
  for (let i = 0; i < refs.length; i += 200) {
    const { data } = await supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, last_name, status')
      .in('employer_ref', refs.slice(i, i + 200));
    for (const a of data || []) accounts.set(a.employer_ref, a);
  }

  const show = (title, map) => {
    const hits = [...map.values()].reduce((n, v) => n + v.length, 0);
    console.log(`\n${'='.repeat(72)}\n${title}: ${map.size} account(s), ${hits} link message(s)\n${'='.repeat(72)}`);
    for (const [ref, hitsForRef] of [...map.entries()].sort((a, b) => b[1].length - a[1].length)) {
      const a = accounts.get(ref);
      const convs = new Set(hitsForRef.map((h) => h.conversation_id)).size;
      console.log(`\n${ref}  ${a ? `${a.first_name} ${a.last_name}` : '?'}  [${a?.status || '?'}]`
        + `  ${hitsForRef.length} link(s), ${convs} conversation(s)`);
      const h = hitsForRef[0];
      console.log(`  ${h.created_at.slice(0, 10)}  ${h.links.join(', ')}`);
      if (h.asked) {
        console.log(`  helper ${h.asked.reason}: "${clip(h.asked.text, 160)}"`);
        if (!h.invited) console.log(`  …but the account had already linked into ${h.spread} other conversation(s)`);
      }
      console.log(`  family: ${clip(h.content_original, 200)}`);
    }
  };

  // The alert is one mail per account per DAY, so a suppressed message only
  // costs something when every link that account sent that day was suppressed.
  // That is the number to judge the rule by — not the message count.
  const days = new Map();
  for (const list of [...alert.values(), ...suppressed.values()]) {
    for (const h of list) {
      const key = `${h.sender_ref} ${h.created_at.slice(0, 10)}`;
      if (!days.has(key)) days.set(key, { mailed: 0, silent: 0 });
      days.get(key)[h.invited ? 'silent' : 'mailed'] += 1;
    }
  }
  const lost = [...days.entries()].filter(([, d]) => d.mailed === 0);

  const scams = [...suppressed.keys()].filter((r) => accounts.get(r)?.status === 'suspended');
  console.log(`Corpus: ${rows.length} messages, ${threads.size} conversations.`);
  show('WOULD STILL ALERT (family sent it unprompted)', alert);
  show('NOW SUPPRESSED (helper asked first)', suppressed);
  if (gaps.length) {
    console.log(`\nInvitation → link: up to ${Math.max(...gaps.map((g) => g.msgs))} message(s) back, `
      + `${Math.max(...gaps.map((g) => g.mins))} minute(s). CONTACT_LINK_HISTORY must clear the first number.`);
  }
  console.log(`\nAdmin mails: ${days.size} account-day(s) produced one before, `
    + `${days.size - lost.length} still do. Days that fall silent: `
    + (lost.length ? lost.map(([k]) => k).join(', ') : 'none'));
  console.log(suppressed.size === 0
    ? '\nNothing is suppressed.'
    : scams.length
      ? `\n⚠️  SUSPENDED ACCOUNTS IN THE SUPPRESSED GROUP: ${scams.join(', ')} — tighten the rule.`
      : '\nNo suspended account is suppressed.');
}

main().catch((e) => { console.error(e); process.exit(1); });
