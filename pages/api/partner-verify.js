// GET /api/partner-verify?t=<verifyToken>
//
// The applicant clicks this in the email sent straight after they submit
// /partners. It proves the address is real — and only then does the admin get
// a notification with the approve/reject buttons.
//
// Renders plain HTML: the applicant arrives here from their inbox, and the
// page is the whole interaction.

import { getServiceSupabase } from '@/lib/supabase';
import { verifyVerifyToken } from '@/lib/company-invite';
import { adminPage, esc } from '@/lib/partner-emails';
import { sendAdminNotification } from '@/lib/partner-notify';

const ERROR_ACCENT = '#b91c1c';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const payload = await verifyVerifyToken(req.query.t);
  if (!payload) {
    return res.status(400).send(adminPage('Link expired',
      `<h2 style="color:${ERROR_ACCENT};margin:0 0 10px;">Link expired or invalid</h2>
       <p style="color:#444;line-height:1.6;">This confirmation link is no longer valid. Please apply again at
       <a href="/partners" style="color:#006a62;">thaihelper.app/partners</a>.</p>
       <p style="color:#888;font-size:13px;line-height:1.7;margin-top:14px;">ลิงก์ยืนยันนี้ใช้ไม่ได้แล้ว กรุณาสมัครใหม่อีกครั้ง</p>`,
      ERROR_ACCENT));
  }

  const supabase = getServiceSupabase();

  const { data: account, error } = await supabase
    .from('company_accounts')
    .select('id, email, company_name, contact_name, phone, type, status, listing_draft, email_verified')
    .eq('id', payload.id)
    .single();

  if (error || !account) {
    return res.status(404).send(adminPage('Not found',
      `<h2 style="color:${ERROR_ACCENT};margin:0 0 10px;">Application not found</h2>
       <p style="color:#444;">This application no longer exists.</p>`,
      ERROR_ACCENT));
  }

  // Already confirmed — don't re-notify the admin every time the link is
  // clicked (mail clients prefetch, people forward emails to colleagues).
  if (account.email_verified) {
    return res.status(200).send(adminPage('Already confirmed',
      `<h2 style="color:#006a62;margin:0 0 10px;">Already confirmed ✓</h2>
       <p style="color:#444;line-height:1.6;">Thanks — we have your application for <strong>${esc(account.company_name)}</strong> and we're reviewing it. You'll hear from us within a few days.</p>
       <p style="color:#888;font-size:13px;line-height:1.7;margin-top:14px;">ขอบคุณค่ะ/ครับ เราได้รับใบสมัครของคุณแล้วและกำลังตรวจสอบอยู่</p>`));
  }

  const { error: updErr } = await supabase
    .from('company_accounts')
    .update({
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (updErr) {
    console.error('partner-verify update error', updErr);
    return res.status(500).send(adminPage('Error',
      `<h2 style="color:${ERROR_ACCENT};margin:0 0 10px;">Something went wrong</h2>
       <p style="color:#444;">Could not confirm your email right now. Please try the link again in a moment.</p>`,
      ERROR_ACCENT));
  }

  await sendAdminNotification({ ...account, email_verified: true });

  return res.status(200).send(adminPage('Email confirmed',
    `<h2 style="color:#006a62;margin:0 0 10px;">Email confirmed ✓</h2>
     <p style="color:#444;line-height:1.6;">Thanks — your application for <strong>${esc(account.company_name)}</strong> is now with our team. We review every company by hand and you'll hear from us within a few days. If we approve it, we'll email you a private link to set your password and publish your listing.</p>
     <hr style="border:none;border-top:1px solid #eee;margin:22px 0;">
     <p style="color:#444;font-size:14px;line-height:1.7;">ยืนยันอีเมลเรียบร้อยแล้ว ขอบคุณค่ะ/ครับ — ใบสมัครของคุณอยู่กับทีมงานของเราแล้ว เราตรวจสอบทุกบริษัทด้วยตนเอง และจะติดต่อกลับภายในไม่กี่วัน</p>
     <p style="margin:24px 0 0;"><a href="/directory" style="color:#006a62;font-weight:600;text-decoration:none;">Browse the Expert Directory →</a></p>`));
}
