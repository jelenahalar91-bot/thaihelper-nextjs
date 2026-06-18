import { Resend } from 'resend';
import { DIRECTORY_TYPES, DIRECTORY_TYPE_VALUES } from '@/lib/constants/directory';

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Mirror the directory taxonomy so lawyers, visa agents, MOU agencies and
// associations can self-register too — plus 'other' as a catch-all.
const VALID_TYPES = [...DIRECTORY_TYPE_VALUES, 'other'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { companyName, contactName, email, phone, type } = req.body || {};

  if (!companyName || !email) {
    return res.status(400).json({ error: 'Company name and email are required.' });
  }

  const safeType = VALID_TYPES.includes(type) ? type : 'other';

  const TYPE_LABELS = {
    ...Object.fromEntries(DIRECTORY_TYPES.map((tp) => [tp.value, tp.en])),
    other: 'Other',
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border-left:4px solid #006a62;">
      <h2 style="font-size:18px;font-weight:700;color:#006a62;margin:0 0 20px;">
        New Partner Signup — ThaiHelper Directory
      </h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:7px 0;font-size:13px;color:#999;width:140px;vertical-align:top;">Company</td>
          <td style="padding:7px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${esc(companyName)}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;font-size:13px;color:#999;vertical-align:top;">Contact</td>
          <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${esc(contactName || '—')}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;font-size:13px;color:#999;vertical-align:top;">Email</td>
          <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${esc(email)}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;font-size:13px;color:#999;vertical-align:top;">Phone / LINE</td>
          <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${esc(phone || '—')}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;font-size:13px;color:#999;vertical-align:top;">Type</td>
          <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${esc(TYPE_LABELS[safeType])}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;

  // Bilingual confirmation sent back to the company that registered.
  const greetName = contactName ? esc(contactName) : 'there';
  const confirmationHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border-left:4px solid #006a62;">
      <h2 style="font-size:20px;font-weight:700;color:#006a62;margin:0 0 18px;">Thanks for registering with ThaiHelper 🙏</h2>

      <p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 14px;">
        Hi ${greetName},<br>
        Thanks for registering <strong>${esc(companyName)}</strong> for the ThaiHelper Expert Directory. We've received your details and our team will review your listing — we'll be in touch within a few days.
      </p>
      <p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 22px;">
        In the meantime you can browse the directory at
        <a href="https://www.thaihelper.app/directory" style="color:#006a62;font-weight:600;text-decoration:none;">www.thaihelper.app/directory</a>.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:0 0 22px;">

      <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0 0 14px;">
        สวัสดีค่ะ/ครับ<br>
        ขอบคุณที่ลงทะเบียน <strong>${esc(companyName)}</strong> สำหรับ ThaiHelper Expert Directory เราได้รับข้อมูลของคุณแล้ว ทีมงานจะตรวจสอบรายชื่อของคุณ และจะติดต่อกลับภายในไม่กี่วัน
      </p>
      <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0 0 22px;">
        ระหว่างนี้สามารถดูไดเรกทอรีได้ที่
        <a href="https://www.thaihelper.app/directory" style="color:#006a62;font-weight:600;text-decoration:none;">www.thaihelper.app/directory</a>
      </p>

      <p style="font-size:13px;color:#888;margin:8px 0 0;">— The ThaiHelper Team</p>
    </div>
    <p style="font-size:11px;color:#bbb;text-align:center;margin:16px 0 0;">
      You received this because ${esc(companyName)} registered at thaihelper.app/partners.
    </p>
  </div>
</body>
</html>`;

  const fromAddr = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';

  // 1. Admin notification — critical: if this fails the signup didn't land.
  try {
    await resend.emails.send({
      from: fromAddr,
      to: process.env.ADMIN_EMAIL || 'support@thaihelper.app',
      subject: `New partner signup: ${companyName}`,
      html,
    });
  } catch (err) {
    console.error('partner-signup admin email error', err);
    return res.status(500).json({ error: 'Failed to send.' });
  }

  // 2. Confirmation to the company — best-effort: a bounce here shouldn't
  //    fail the request, the signup is already captured via the admin mail.
  try {
    await resend.emails.send({
      from: fromAddr,
      to: email,
      subject: 'Thanks for registering with ThaiHelper',
      html: confirmationHtml,
    });
  } catch (err) {
    console.error('partner-signup confirmation email error', err);
  }

  return res.status(200).json({ ok: true });
}
