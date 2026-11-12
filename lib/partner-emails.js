/**
 * Email bodies and admin confirmation pages for the partner application flow.
 *
 * Four routes send mail in this flow (/api/partner-signup, partner-verify,
 * company-approve, company-request-info) and three of them render an HTML page
 * straight into the admin's browser. Keeping the markup here stops the same
 * table layout being copy-pasted four times and drifting apart.
 */

import { formatCity } from '@/lib/constants/cities';
import { formatDirectoryType, formatCsvList, DIRECTORY_LANGUAGES, NATIONALITIES_PLACED } from '@/lib/constants/directory';

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thaihelper.app';
export const FROM_ADDR = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
export const ADMIN_ADDR = process.env.ADMIN_EMAIL || 'support@thaihelper.app';

const TEAL = '#006a62';

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/** Shell for the plain HTML pages the admin lands on from an email button. */
export function adminPage(title, body, accent = TEAL) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:48px auto;padding:0 20px;">
  <div style="background:#fff;border-radius:14px;padding:32px;border-top:4px solid ${accent};">
    ${body}
  </div>
</div></body></html>`;
}

/** Shell for every email we send in this flow. */
function mailShell(inner, footer = '') {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border-left:4px solid ${TEAL};">
      ${inner}
    </div>
    ${footer}
  </div>
</body></html>`;
}

function button(href, label, bg = TEAL) {
  return `<a href="${href}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;">${label}</a>`;
}

function row(label, value) {
  return `<tr>
    <td style="padding:7px 0;font-size:13px;color:#999;width:150px;vertical-align:top;">${esc(label)}</td>
    <td style="padding:7px 0;font-size:14px;color:#1a1a1a;">${value}</td>
  </tr>`;
}

function link(url) {
  return url ? `<a href="${esc(url)}" style="color:${TEAL};word-break:break-all;">${esc(url)}</a>` : '—';
}

// ---------------------------------------------------------------------------
// 1. To the applicant, immediately on submit: confirm the address is real.
// ---------------------------------------------------------------------------

export function verificationEmail({ companyName, contactName, verifyUrl }) {
  const greet = contactName ? esc(contactName) : 'there';
  return {
    subject: 'Confirm your email — ThaiHelper Directory / ยืนยันอีเมลของคุณ',
    html: mailShell(`
      <h2 style="font-size:20px;font-weight:700;color:${TEAL};margin:0 0 18px;">One more step — confirm your email</h2>
      <p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 14px;">
        Hi ${greet},<br>
        Thanks for applying to list <strong>${esc(companyName)}</strong> in the ThaiHelper Expert Directory. Please confirm this email address so we can review your application — we can't start without it.
      </p>
      <div style="margin:22px 0;">${button(verifyUrl, 'Confirm my email →')}</div>
      <p style="font-size:12px;color:#999;line-height:1.5;margin:0 0 20px;">This link expires in 7 days. If you didn't apply, just ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:0 0 22px;">
      <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0 0 14px;">
        สวัสดีค่ะ/ครับ<br>
        ขอบคุณที่สมัครลงรายชื่อ <strong>${esc(companyName)}</strong> ใน ThaiHelper Expert Directory กรุณายืนยันอีเมลนี้เพื่อให้เราเริ่มตรวจสอบใบสมัครของคุณได้
      </p>
      <div style="margin:22px 0;">${button(verifyUrl, 'ยืนยันอีเมลของฉัน →')}</div>
      <p style="font-size:12px;color:#999;line-height:1.5;margin:0 0 20px;">ลิงก์นี้หมดอายุใน 7 วัน</p>
      <p style="font-size:13px;color:#888;margin:8px 0 0;">— The ThaiHelper Team</p>`),
    text:
      `Hi ${contactName || 'there'},\n\n` +
      `Thanks for applying to list ${companyName} in the ThaiHelper Expert Directory.\n\n` +
      `Confirm your email address so we can review your application:\n${verifyUrl}\n\n` +
      `This link expires in 7 days. If you didn't apply, ignore this email.\n\n— The ThaiHelper Team`,
  };
}

// ---------------------------------------------------------------------------
// 2. To the admin, once the address is confirmed: the full application.
// ---------------------------------------------------------------------------

export function adminNotificationEmail({ account, draft, existing, approveUrl, moreInfoUrl, rejectUrl }) {
  const d = draft || {};
  const { takesOver = null, otherBranches = [], lookalikes = [] } = existing || {};
  const entryUrl = (l) => `${BASE_URL}/directory/${l.slug}`;
  const entryLink = (l) => `<a href="${entryUrl(l)}" style="color:${TEAL};">/directory/${esc(l.slug)}</a>`;

  // Shown above the table: what approving will actually do to the directory.
  let existingHtml = '';
  let existingText = '';
  if (takesOver) {
    const rest = otherBranches.length
      ? ` The same address is on ${otherBranches.length} more ${otherBranches.length === 1 ? 'entry' : 'entries'} (${otherBranches.map(entryLink).join(', ')}) — an account holds one entry, so those stay as they are.`
      : '';
    existingHtml = `<div style="margin:0 0 20px;padding:14px 16px;background:#ecfdf5;border-left:4px solid #16a34a;border-radius:6px;font-size:14px;color:#14532d;line-height:1.55;">
        <strong>Already listed — this is a takeover.</strong> Their confirmed address proves the existing entry ${entryLink(takesOver)}. Approving hands that entry to them; no second one is created, and the address stays the same.${rest}
      </div>`;
    existingText = `ALREADY LISTED — takeover of ${entryUrl(takesOver)} (confirmed address matches the entry). No second entry is created.`
      + (otherBranches.length ? ` Other entries with the same address stay as they are: ${otherBranches.map(entryUrl).join(', ')}` : '')
      + '\n\n';
  } else if (lookalikes.length) {
    existingHtml = `<div style="margin:0 0 20px;padding:14px 16px;background:#fffbeb;border-left:4px solid #d97706;border-radius:6px;font-size:14px;color:#78350f;line-height:1.55;">
        <strong>Check before approving.</strong> The website they gave is already on ${lookalikes.map((l) => `${entryLink(l)} (${esc(l.email || 'no address')})`).join(', ')}, but they applied from a different address, so nothing proves they are that company. Approving as it stands creates a <em>second</em> entry. If it is them, ask them to apply from the company address — or link the entry by hand.
      </div>`;
    existingText = `CHECK BEFORE APPROVING — same website as ${lookalikes.map(entryUrl).join(', ')}, but a different address. Approving creates a second entry.\n\n`;
  }
  const languages = formatCsvList(d.languages_spoken, DIRECTORY_LANGUAGES);
  const nationalities = formatCsvList(d.nationalities_placed, NATIONALITIES_PLACED);
  const citiesServed = String(d.cities_served || '')
    .split(',').filter(Boolean).map(formatCity).join(', ');

  const rows = [
    row('Company', `<strong>${esc(account.company_name)}</strong>`),
    row('Contact', esc(account.contact_name || '—')),
    row('Email', `${esc(account.email)} <span style="color:#16a34a;font-size:12px;">✓ confirmed</span>`),
    row('Phone', esc(d.phone || account.phone || '—')),
    row('LINE', d.line_id ? esc(d.line_id) : '—'),
    row('Type', esc(formatDirectoryType(d.type || account.type) || account.type || '—')),
    row('City', esc(formatCity(d.city) || '—')),
    citiesServed ? row('Also serves', esc(citiesServed)) : '',
    row('Website', link(d.website)),
    row('Google Maps', link(d.google_maps_url)),
    d.license_number ? row('Licence no.', esc(d.license_number)) : '',
    languages ? row('Languages', esc(languages)) : '',
    nationalities ? row('Places', esc(nationalities)) : '',
    d.pricing_url ? row('Pricing', link(d.pricing_url)) : '',
  ].filter(Boolean).join('');

  const description = d.description
    ? `<div style="margin:20px 0 0;padding:16px;background:#f8fafc;border-radius:8px;">
         <p style="font-size:12px;color:#999;margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em;">About the company</p>
         <p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0;white-space:pre-wrap;">${esc(d.description)}</p>
       </div>`
    : '';

  return {
    subject: `Partner application (confirmed): ${account.company_name}`,
    html: mailShell(`
      <h2 style="font-size:18px;font-weight:700;color:${TEAL};margin:0 0 20px;">New Partner Application — ThaiHelper Directory</h2>
      ${existingHtml}
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      ${description}
      <div style="margin:28px 0 8px;">${button(approveUrl, '✓ Approve &amp; send access link')}</div>
      <div style="margin:10px 0 0;">
        <a href="${moreInfoUrl}" style="display:inline-block;color:#b45309;text-decoration:none;font-weight:600;font-size:14px;padding:10px 0;margin-right:22px;">✎ Ask for more information</a>
        <a href="${rejectUrl}" style="display:inline-block;color:#b91c1c;text-decoration:none;font-weight:600;font-size:14px;padding:10px 0;">✕ Reject</a>
      </div>
      <p style="font-size:12px;color:#999;line-height:1.5;margin:14px 0 0;">
        Approving emails <strong>${esc(account.company_name)}</strong> a private link to set their password and publish their listing. "Ask for more information" emails them a list of what's missing and leaves the application pending. "Reject" closes it without writing to them.
      </p>`),
    text:
      `New partner application (email confirmed): ${account.company_name}\n\n` +
      existingText +
      `Contact: ${account.contact_name || '—'}\nEmail: ${account.email}\n` +
      `Phone: ${d.phone || account.phone || '—'}\nLINE: ${d.line_id || '—'}\n` +
      `Type: ${formatDirectoryType(d.type || account.type) || '—'}\nCity: ${formatCity(d.city) || '—'}\n` +
      `Website: ${d.website || '—'}\nGoogle Maps: ${d.google_maps_url || '—'}\n\n` +
      `${d.description || ''}\n\n` +
      `Approve & send access link:\n${approveUrl}\n\nAsk for more information:\n${moreInfoUrl}\n\nReject:\n${rejectUrl}`,
  };
}

// ---------------------------------------------------------------------------
// 3. To the applicant, when the admin wants more before deciding.
// ---------------------------------------------------------------------------

const MISSING_LABELS = {
  city:        { en: 'The city or province in Thailand where you operate', th: 'เมืองหรือจังหวัดในประเทศไทยที่คุณให้บริการ' },
  link:        { en: 'A website, Facebook page or Google Maps listing for your business', th: 'เว็บไซต์ เพจเฟซบุ๊ก หรือ Google Maps ของธุรกิจคุณ' },
  description: { en: 'A short description of what your company does (a few sentences)', th: 'คำอธิบายสั้นๆ ว่าบริษัทของคุณทำอะไร (ไม่กี่ประโยค)' },
  phone:       { en: 'A phone number we can reach you on, with its country code', th: 'เบอร์โทรศัพท์ที่ติดต่อได้ พร้อมรหัสประเทศ' },
  contact:     { en: 'The name of a contact person at your company', th: 'ชื่อผู้ติดต่อของบริษัทคุณ' },
  type:        { en: 'What kind of company you are (agency, lawyer, service company…)', th: 'ประเภทของบริษัท (บริษัทจัดหางาน ทนายความ บริษัทบริการ…)' },
};

export function moreInfoEmail({ companyName, contactName, missing, applyUrl }) {
  const greet = contactName ? esc(contactName) : 'there';
  const keys = (missing && missing.length) ? missing : ['link', 'description'];
  const listEn = keys.map(k => `<li style="margin:0 0 8px;">${esc(MISSING_LABELS[k]?.en || k)}</li>`).join('');
  const listTh = keys.map(k => `<li style="margin:0 0 8px;">${esc(MISSING_LABELS[k]?.th || k)}</li>`).join('');

  return {
    subject: 'A few more details for your ThaiHelper listing / ขอข้อมูลเพิ่มเติม',
    html: mailShell(`
      <h2 style="font-size:20px;font-weight:700;color:${TEAL};margin:0 0 18px;">We need a little more information</h2>
      <p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 14px;">
        Hi ${greet},<br>
        Thanks for applying to list <strong>${esc(companyName)}</strong> in the ThaiHelper Expert Directory. We review every company by hand, and we're missing a few things before we can make a decision:
      </p>
      <ul style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 18px;padding-left:20px;">${listEn}</ul>
      <p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 14px;">
        Just reply to this email with the details, or submit the form again with everything filled in — either works.
      </p>
      <div style="margin:22px 0;">${button(applyUrl, 'Open the form again →')}</div>
      <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">
        One thing worth saying plainly: the ThaiHelper directory only lists companies that operate <strong>inside Thailand</strong>, serving families and expats there. If that isn't your business, there's no need to reply — and thank you for your interest all the same.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:0 0 22px;">
      <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0 0 14px;">
        สวัสดีค่ะ/ครับ<br>
        ขอบคุณที่สมัครลงรายชื่อ <strong>${esc(companyName)}</strong> ใน ThaiHelper Expert Directory เราตรวจสอบทุกบริษัทด้วยตนเอง และยังขาดข้อมูลบางอย่างก่อนตัดสินใจ:
      </p>
      <ul style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0 0 18px;padding-left:20px;">${listTh}</ul>
      <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0 0 14px;">
        ตอบกลับอีเมลนี้พร้อมข้อมูล หรือกรอกแบบฟอร์มใหม่อีกครั้งก็ได้ค่ะ/ครับ
      </p>
      <p style="font-size:13px;color:#888;margin:8px 0 0;">— The ThaiHelper Team</p>`),
    text:
      `Hi ${contactName || 'there'},\n\n` +
      `Thanks for applying to list ${companyName} in the ThaiHelper Expert Directory. ` +
      `We review every company by hand, and we're missing a few things before we can decide:\n\n` +
      keys.map(k => `  - ${MISSING_LABELS[k]?.en || k}`).join('\n') + '\n\n' +
      `Reply to this email with the details, or fill the form in again: ${applyUrl}\n\n` +
      `One thing worth saying plainly: the ThaiHelper directory only lists companies operating inside Thailand, ` +
      `serving families and expats there. If that isn't your business, there's no need to reply — ` +
      `and thank you for your interest all the same.\n\n— The ThaiHelper Team`,
  };
}
