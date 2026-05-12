#!/usr/bin/env node
/**
 * Admin script: re-send the email verification mail to one or more
 * unverified accounts. Re-issues a fresh verification_token in the DB
 * before re-sending so the link in the new email actually works.
 *
 * Usage:
 *   node scripts/send-verify-reminders.js --ref=TH-XXX        # one helper
 *   node scripts/send-verify-reminders.js --emp=EMP-XXX       # one employer
 *   node scripts/send-verify-reminders.js --all-unverified    # everyone with email_verified=false
 *
 * Loads .env.local for Supabase + Resend keys. Use --dry-run to preview
 * without writing tokens or sending mail.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) return;
    const [, k, raw] = m;
    if (!process.env[k]) process.env[k] = raw.replace(/^['"]|['"]$/g, '');
  });
}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SR_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
if (!RESEND_KEY) {
  console.error('Missing RESEND_API_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const allUnverified = args.includes('--all-unverified');
const refArg = args.find(a => a.startsWith('--ref='))?.slice(6);
const empArg = args.find(a => a.startsWith('--emp='))?.slice(6);

if (!allUnverified && !refArg && !empArg) {
  console.error('Pass --ref=TH-XXX, --emp=EMP-XXX, or --all-unverified');
  process.exit(1);
}

// Lazy-require the email senders so .env is set before the module loads.
// Use the same module the rest of the app uses — single source of truth.
const {
  sendHelperConfirmation,
  sendEmployerAccountConfirmation,
} = require('../lib/send-confirmation-email');

(async () => {
  const supabase = createClient(SUPABASE_URL, SR_KEY, {
    auth: { persistSession: false },
  });

  // Build target list
  const targets = []; // { table, refCol, ref, first_name, email, city, category }

  if (allUnverified) {
    const { data: helpers } = await supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, email, city, category')
      .eq('email_verified', false);
    helpers?.forEach(h => targets.push({
      table: 'helper_profiles',
      refCol: 'helper_ref',
      kind: 'helper',
      ref: h.helper_ref,
      first_name: h.first_name,
      email: h.email,
      city: h.city,
      category: h.category,
    }));
    const { data: emps } = await supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, email, city')
      .eq('email_verified', false);
    emps?.forEach(e => targets.push({
      table: 'employer_accounts',
      refCol: 'employer_ref',
      kind: 'employer',
      ref: e.employer_ref,
      first_name: e.first_name,
      email: e.email,
      city: e.city,
    }));
  } else if (refArg) {
    const { data } = await supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, email, city, category, email_verified')
      .eq('helper_ref', refArg)
      .single();
    if (!data) { console.error('Helper not found:', refArg); process.exit(1); }
    if (data.email_verified) { console.log('Already verified:', refArg); process.exit(0); }
    targets.push({
      table: 'helper_profiles', refCol: 'helper_ref', kind: 'helper',
      ref: data.helper_ref, first_name: data.first_name, email: data.email,
      city: data.city, category: data.category,
    });
  } else if (empArg) {
    const { data } = await supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, email, city, email_verified')
      .eq('employer_ref', empArg)
      .single();
    if (!data) { console.error('Employer not found:', empArg); process.exit(1); }
    if (data.email_verified) { console.log('Already verified:', empArg); process.exit(0); }
    targets.push({
      table: 'employer_accounts', refCol: 'employer_ref', kind: 'employer',
      ref: data.employer_ref, first_name: data.first_name, email: data.email,
      city: data.city,
    });
  }

  console.log(`\n📨 Sending verify reminders to ${targets.length} account(s)${dryRun ? ' (DRY RUN)' : ''}\n`);

  const results = { sent: [], errors: [] };
  for (const t of targets) {
    const token = crypto.randomBytes(32).toString('hex');
    const label = `${t.kind}/${t.ref}/${t.first_name} <${t.email}>`;

    if (dryRun) {
      console.log('  📋 would send to:', label);
      continue;
    }

    // 1) Write new token
    const { error: upErr } = await supabase
      .from(t.table)
      .update({ verification_token: token })
      .eq(t.refCol, t.ref);
    if (upErr) {
      results.errors.push({ target: label, error: 'token-update: ' + upErr.message });
      console.log('  ✗ token write failed for', label);
      continue;
    }

    // 2) Send email
    try {
      if (t.kind === 'helper') {
        await sendHelperConfirmation({
          firstName: t.first_name,
          email: t.email,
          ref: t.ref,
          category: t.category,
          city: t.city,
          verificationToken: token,
        });
      } else {
        await sendEmployerAccountConfirmation({
          firstName: t.first_name,
          email: t.email,
          ref: t.ref,
          city: t.city,
          verificationToken: token,
        });
      }
      results.sent.push(label);
      console.log('  ✅ sent to', label);
    } catch (err) {
      results.errors.push({ target: label, error: err.message });
      console.log('  ✗ send failed for', label, '—', err.message);
    }
  }

  console.log(`\n— done. sent: ${results.sent.length}, errors: ${results.errors.length}\n`);
  if (results.errors.length) {
    console.log('errors:');
    results.errors.forEach(e => console.log('  -', e.target, ':', e.error));
  }
})();
