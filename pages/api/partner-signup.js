import crypto from 'crypto';
import { Resend } from 'resend';
import { DIRECTORY_TYPES, DIRECTORY_TYPE_VALUES } from '@/lib/constants/directory';
import { getServiceSupabase } from '@/lib/supabase';
import { createApproveToken } from '@/lib/company-invite';

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thaihelper.app';

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function generateCompanyRef() {
  // Public reference for the account. crypto (not Math.random) — it's a
  // user-facing id, no need to be secret, but no reason to be guessable.
  return 'BIZ-' + crypto.randomBytes(6).toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
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

  const cleanEmail = String(email).trim().toLowerCase();
  const safeType = VALID_TYPES.includes(type) ? type : 'other';

  const TYPE_LABELS = {
    ...Object.fromEntries(DIRECTORY_TYPES.map((tp) => [tp.value, tp.en])),
    other: 'Other',
  };

  const supabase = getServiceSupabase();

  // Upsert the application as a company_accounts row in 'requested' state.
  // If they already have an ACTIVE account, don't recreate it — they should
  // just log in. Otherwise (new, or a previous request/invite) refresh the
  // details and let the admin (re-)approve.
  let account;
  try {
    const { data: existing } = await supabase
      .from('company_accounts')
      .select('id, status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing?.status === 'active') {
      // Already onboarded — nothing to do. Respond the same as success so we
      // don't reveal account existence to a random submitter.
      return res.status(200).json({ ok: true });
    }

    if (existing) {
      const { data, error } = await supabase
        .from('company_accounts')
        .update({
          company_name: companyName.trim(),
          contact_name: contactName?.trim() || null,
          phone: phone?.trim() || null,
          type: safeType,
          status: 'requested',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single();
      if (error) throw error;
      account = data;
    } else {
      const { data, error } = await supabase
        .from('company_accounts')
        .insert({
          company_ref: generateCompanyRef(),
          email: cleanEmail,
          company_name: companyName.trim(),
          contact_name: contactName?.trim() || null,
          phone: phone?.trim() || null,
          type: safeType,
          status: 'requested',
        })
        .select('id')
        .single();
      if (error) throw error;
      account = data;
    }
  } catch (err) {
    // Degrade gracefully: if the company_accounts table isn't there yet
    // (e.g. deployed before the migration ran) we must NOT break the lead
    // funnel. Fall back to a plain admin notification with no approve link.
    console.error('partner-signup db error (falling back to plain notification)', err);
    account = null;
  }

  // One-click approval link for the admin — only when the account row was
  // created. Clicking it approves the application and emails the company its
  // onboarding (set-password) link.
  const approveToken = account ? await createApproveToken(account.id) : null;
  const approveUrl = approveToken
    ? `${BASE_URL}/api/company-approve?t=${encodeURIComponent(approveToken)}`
    : null;

  const approveBlock = approveUrl
    ? `<div style="margin:28px 0 8px;">
        <a href="${approveUrl}" style="display:inline-block;background:#006a62;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;">
          ✓ Approve &amp; send access link
        </a>
      </div>
      <p style="font-size:12px;color:#999;line-height:1.5;margin:14px 0 0;">
        Clicking this approves <strong>${esc(companyName)}</strong> and emails them a private link to set their password and fill in their listing. Only click if you want them listed.
      </p>`
    : `<p style="font-size:13px;color:#b45309;line-height:1.5;margin:20px 0 0;">
        ⚠️ Account record could not be created (is the company_accounts table set up?). Handle this application manually for now.
      </p>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border-left:4px solid #006a62;">
      <h2 style="font-size:18px;font-weight:700;color:#006a62;margin:0 0 20px;">
        New Partner Application — ThaiHelper Directory
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
          <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${esc(cleanEmail)}</td>
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

      ${approveBlock}
    </div>
  </div>
</body>
</html>`;

  // Bilingual confirmation sent back to the company that applied.
  const greetName = contactName ? esc(contactName) : 'there';
  const confirmationHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border-left:4px solid #006a62;">
      <h2 style="font-size:20px;font-weight:700;color:#006a62;margin:0 0 18px;">Thanks for applying to ThaiHelper 🙏</h2>

      <p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 14px;">
        Hi ${greetName},<br>
        Thanks for applying to list <strong>${esc(companyName)}</strong> in the ThaiHelper Expert Directory. We review every company by hand — once approved, we'll email you a private link to set up your profile (logo, details and photos). You'll hear from us within a few days.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:18px 0 22px;">

      <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0 0 14px;">
        สวัสดีค่ะ/ครับ<br>
        ขอบคุณที่สมัครลงรายชื่อ <strong>${esc(companyName)}</strong> ใน ThaiHelper Expert Directory เราตรวจสอบทุกบริษัทด้วยตนเอง เมื่ออนุมัติแล้ว เราจะส่งลิงก์ส่วนตัวให้คุณตั้งค่าโปรไฟล์ (โลโก้ รายละเอียด และรูปภาพ) คุณจะได้รับข่าวจากเราภายในไม่กี่วัน
      </p>

      <p style="font-size:13px;color:#888;margin:8px 0 0;">— The ThaiHelper Team</p>
    </div>
    <p style="font-size:11px;color:#bbb;text-align:center;margin:16px 0 0;">
      You received this because ${esc(companyName)} applied at thaihelper.app/partners.
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
      subject: `New partner application: ${companyName}`,
      html,
      text:
        `New partner application: ${companyName}\n` +
        `Contact: ${contactName || '—'}\nEmail: ${cleanEmail}\n` +
        `Phone: ${phone || '—'}\nType: ${TYPE_LABELS[safeType]}\n\n` +
        (approveUrl ? `Approve & send access link:\n${approveUrl}` : 'Account record could not be created — handle this application manually.'),
    });
  } catch (err) {
    console.error('partner-signup admin email error', err);
    return res.status(500).json({ error: 'Failed to send.' });
  }

  // 2. Confirmation to the company — best-effort: a bounce here shouldn't
  //    fail the request, the application is already captured.
  try {
    await resend.emails.send({
      from: fromAddr,
      to: cleanEmail,
      subject: 'Thanks for applying to ThaiHelper',
      html: confirmationHtml,
      text:
        `Hi ${contactName || 'there'},\n\n` +
        `Thanks for applying to list ${companyName} in the ThaiHelper Expert Directory. ` +
        `We review every company by hand — once approved, we'll email you a private link to set up your profile (logo, details and photos). ` +
        `You'll hear from us within a few days.\n\n— The ThaiHelper Team`,
    });
  } catch (err) {
    console.error('partner-signup confirmation email error', err);
  }

  return res.status(200).json({ ok: true });
}
