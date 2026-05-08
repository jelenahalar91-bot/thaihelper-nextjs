#!/usr/bin/env node
/**
 * One-off recovery: when a user registered with a typo'd email, this
 * script updates their email in the DB to the corrected address,
 * regenerates a fresh verification token, and sends them a friendly
 * "we noticed your typo, here's a new verification link" email.
 *
 * Usage:
 *   node scripts/fix-typo-and-resend.js EMP-XXXXXX old@gmaip.com new@gmail.com
 *   node scripts/fix-typo-and-resend.js TH-XXXXXX  old@gmaip.com new@gmail.com
 *
 * Add --dry to preview without writing or sending.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Load .env.local
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
} catch {}

const args = process.argv.slice(2).filter(a => a !== '--dry');
const dry = process.argv.includes('--dry');
if (args.length !== 3) {
  console.error('Usage: node scripts/fix-typo-and-resend.js <REF> <oldEmail> <newEmail> [--dry]');
  process.exit(1);
}
const [ref, oldEmail, newEmail] = args;
const isEmployer = ref.startsWith('EMP-');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const resend = new Resend(process.env.RESEND_API_KEY);

(async () => {
  const table = isEmployer ? 'employer_accounts' : 'helper_profiles';
  const refCol = isEmployer ? 'employer_ref' : 'helper_ref';

  const { data: row, error: fetchErr } = await supabase
    .from(table)
    .select('*')
    .eq(refCol, ref)
    .single();
  if (fetchErr || !row) {
    console.error(`Could not find ${ref} in ${table}:`, fetchErr?.message);
    process.exit(1);
  }
  if (row.email !== oldEmail.toLowerCase()) {
    console.error(`Email mismatch — expected "${oldEmail}", DB has "${row.email}". Aborting.`);
    process.exit(1);
  }

  const newToken = crypto.randomBytes(32).toString('hex');
  const verifyUrl = `https://thaihelper.app/api/verify-email?token=${newToken}`;
  const firstName = row.first_name || 'there';

  console.log('Plan:');
  console.log(`  ${ref}  ${row.first_name} ${row.last_name?.[0] || ''}.`);
  console.log(`  email      ${oldEmail}  →  ${newEmail}`);
  console.log(`  new token  ${newToken.slice(0, 12)}…`);
  console.log(`  verify URL ${verifyUrl}`);
  console.log();

  if (dry) {
    console.log('--dry: not writing or sending.');
    return;
  }

  // 1) Update email + token + verified=false
  const { error: updErr } = await supabase
    .from(table)
    .update({
      email: newEmail.toLowerCase(),
      verification_token: newToken,
      email_verified: false,
    })
    .eq(refCol, ref);
  if (updErr) { console.error('Update failed:', updErr); process.exit(1); }
  console.log('✓ DB updated');

  // 2) Send recovery email — custom HTML with the typo apology up top
  //    plus the standard reference + verify button.
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">
        Hi ${firstName} — quick fix to your email
      </h1>
      <p style="font-size:15px;color:#444;margin:0 0 24px;line-height:1.55;">
        When you registered, the email you entered had a small typo
        (<strong>${oldEmail}</strong>) so the original verification
        message bounced. We've corrected it to
        <strong>${newEmail}</strong> — please verify below to
        activate your account.
      </p>

      <div style="background:#f0f2f5;border-radius:12px;padding:20px 24px;margin-bottom:20px;text-align:center;">
        <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
          Your Reference Number
        </div>
        <div style="font-size:22px;font-weight:700;color:#001b3d;font-family:monospace;letter-spacing:1px;">
          ${ref}
        </div>
        <div style="font-size:12px;color:#999;margin-top:8px;">
          Save this — you'll need it to log in
        </div>
      </div>

      <div style="text-align:center;margin-bottom:20px;">
        <a href="${verifyUrl}" style="display:inline-block;padding:16px 36px;background:#001b3d;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Verify My Email
        </a>
        <p style="font-size:12px;color:#999;margin-top:12px;">Click the button to activate your account</p>
      </div>

      <div style="background:#fff8e1;border-left:3px solid #f5a623;border-radius:8px;padding:14px 18px;margin-bottom:8px;">
        <div style="font-size:13px;color:#1a1a1a;font-weight:600;margin-bottom:4px;">How to log in</div>
        <div style="font-size:13px;color:#555;line-height:1.5;">
          Visit <a href="https://thaihelper.app/login" style="color:#001b3d;">thaihelper.app/login</a>
          and enter your corrected email (<strong>${newEmail}</strong>) together with the reference number above.
        </div>
      </div>

      <p style="font-size:12px;color:#999;margin:24px 0 0;line-height:1.5;text-align:center;">
        Didn't sign up for ThaiHelper? Just ignore this email — no account will be activated.
      </p>
    </div>
    <div style="text-align:center;margin-top:24px;font-size:12px;color:#999;">
      ThaiHelper · <a href="https://thaihelper.app" style="color:#999;">thaihelper.app</a>
    </div>
  </div>
</body>
</html>
  `;

  const { error: mailErr } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <noreply@thaihelper.app>',
    to: newEmail,
    subject: `Hi ${firstName} — small typo in your email, here's a fresh verification link`,
    html,
  });
  if (mailErr) { console.error('Email send failed:', mailErr); process.exit(1); }
  console.log(`✓ Verification email sent to ${newEmail}`);
})();
