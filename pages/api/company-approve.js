// GET /api/company-approve?t=<approveToken>
//
// The one-click link in the admin notification email. Verifies the signed
// approve token, flips the company account to 'invited', and emails the
// company a private onboarding link (set password + fill listing).
//
// Renders a plain HTML confirmation page because the admin opens this in a
// browser straight from their email — there's no app UI behind it.

import { Resend } from 'resend';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyApproveToken, createInviteToken } from '@/lib/company-invite';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thaihelper.app';

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function page(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:48px auto;padding:0 20px;">
  <div style="background:#fff;border-radius:14px;padding:32px;border-top:4px solid #006a62;">
    ${body}
  </div>
</div></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const token = req.query.t;
  if (!token) {
    return res.status(400).send(page('Invalid link',
      '<h2 style="color:#b91c1c;margin:0 0 10px;">Invalid link</h2><p style="color:#444;">This approval link is missing its token.</p>'));
  }

  const payload = await verifyApproveToken(token);
  if (!payload) {
    return res.status(400).send(page('Link expired',
      '<h2 style="color:#b91c1c;margin:0 0 10px;">Link expired or invalid</h2><p style="color:#444;">This approval link is no longer valid. Ask the company to apply again at /partners.</p>'));
  }

  const supabase = getServiceSupabase();

  const { data: account, error } = await supabase
    .from('company_accounts')
    .select('id, email, company_name, contact_name, status')
    .eq('id', payload.id)
    .single();

  if (error || !account) {
    return res.status(404).send(page('Not found',
      '<h2 style="color:#b91c1c;margin:0 0 10px;">Account not found</h2><p style="color:#444;">This application no longer exists.</p>'));
  }

  if (account.status === 'active') {
    return res.status(200).send(page('Already active',
      `<h2 style="color:#006a62;margin:0 0 10px;">Already set up ✓</h2><p style="color:#444;"><strong>${esc(account.company_name)}</strong> has already completed onboarding and can log in.</p>`));
  }

  // Flip to invited + stamp approval time.
  const { error: updErr } = await supabase
    .from('company_accounts')
    .update({ status: 'invited', approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', account.id);

  if (updErr) {
    console.error('company-approve update error', updErr);
    return res.status(500).send(page('Error',
      '<h2 style="color:#b91c1c;margin:0 0 10px;">Something went wrong</h2><p style="color:#444;">Could not approve right now. Please try the link again.</p>'));
  }

  // Email the company its private onboarding link.
  const inviteToken = await createInviteToken(account.id);
  const onboardUrl = `${BASE_URL}/business-onboarding?t=${encodeURIComponent(inviteToken)}`;
  const greetName = account.contact_name ? esc(account.contact_name) : 'there';

  const inviteHtml = `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border-left:4px solid #006a62;">
      <h2 style="font-size:20px;font-weight:700;color:#006a62;margin:0 0 18px;">You're approved — set up your listing 🎉</h2>

      <p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 14px;">
        Hi ${greetName},<br>
        Good news — <strong>${esc(account.company_name)}</strong> has been approved for the ThaiHelper Expert Directory. Click below to set your password and fill in your profile (logo, description, contact details and more):
      </p>
      <div style="margin:22px 0;">
        <a href="${onboardUrl}" style="display:inline-block;background:#006a62;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;">
          Set up my listing →
        </a>
      </div>
      <p style="font-size:12px;color:#999;line-height:1.5;margin:0 0 20px;">This private link is just for you. It expires in 30 days.</p>

      <hr style="border:none;border-top:1px solid #eee;margin:0 0 22px;">

      <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0 0 14px;">
        สวัสดีค่ะ/ครับ<br>
        ข่าวดี — <strong>${esc(account.company_name)}</strong> ได้รับการอนุมัติให้ลงใน ThaiHelper Expert Directory แล้ว คลิกด้านบนเพื่อตั้งรหัสผ่านและกรอกข้อมูลโปรไฟล์ของคุณ (โลโก้ รายละเอียด ข้อมูลติดต่อ และอื่นๆ) ลิงก์นี้หมดอายุใน 30 วัน
      </p>

      <p style="font-size:13px;color:#888;margin:8px 0 0;">— The ThaiHelper Team</p>
    </div>
  </div>
</body></html>`;

  const fromAddr = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
  let emailed = true;
  try {
    await resend.emails.send({
      from: fromAddr,
      to: account.email,
      subject: 'You\'re approved — set up your ThaiHelper listing',
      html: inviteHtml,
    });
  } catch (err) {
    console.error('company-approve invite email error', err);
    emailed = false;
  }

  const body = emailed
    ? `<h2 style="color:#006a62;margin:0 0 10px;">Approved ✓</h2>
       <p style="color:#444;line-height:1.6;"><strong>${esc(account.company_name)}</strong> is approved and we've emailed <strong>${esc(account.email)}</strong> a private link to set up their listing.</p>`
    : `<h2 style="color:#b45309;margin:0 0 10px;">Approved — but email failed</h2>
       <p style="color:#444;line-height:1.6;"><strong>${esc(account.company_name)}</strong> is approved, but we couldn't send the invite email. Their onboarding link:</p>
       <p style="word-break:break-all;font-size:12px;background:#f5f5f5;padding:12px;border-radius:8px;">${esc(onboardUrl)}</p>`;

  return res.status(200).send(page('Approved', body));
}
