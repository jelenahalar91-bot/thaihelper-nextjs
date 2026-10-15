/**
 * "Are you still looking?" — the monthly check-in to a family that has gone
 * quiet.
 *
 * On 2026-10-14, 182 families were listed as "searching". 131 of them had
 * signed up more than four weeks earlier and only 23 of those had logged in
 * during the previous two weeks. Nobody updates a status they never see, so
 * helpers were writing to families who stopped looking months ago, and we
 * were counting ghosts as demand.
 *
 * Four buttons, each a signed one-click link (lib/family-followup-token.js):
 * still looking, found someone here, found someone elsewhere, not looking
 * any more. No login — see that file for why.
 *
 * What keeps this from becoming a nagging machine:
 *   - at most three check-ins ever per family (status_checkin_count),
 *   - at least 30 days between them,
 *   - only families that are still 'searching' and have not logged in
 *     recently get one at all,
 *   - answering any of the four stops the series,
 *   - notify_on_message is honoured, and every mail carries one-click
 *     unsubscribe.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const L = {
  en: {
    subject: (n) => `${n}, are you still looking for help?`,
    heading: 'Are you still looking?',
    intro: (n, weeks) =>
      `Hi ${n}, you signed up on ThaiHelper about ${weeks} weeks ago and your profile still says you are looking for someone.`,
    why: 'Helpers see that and write to you. If your search is over, one tap below stops the messages — and tells us whether this site actually worked for you.',
    still: 'Yes, still looking',
    here: 'I found someone on ThaiHelper',
    elsewhere: 'I found someone elsewhere',
    stop: 'I’m not looking any more',
    footer_note: 'One tap, no login needed. You can change it any time in your dashboard.',
    unsub: 'Don’t want these emails?',
    unsub_link: 'Unsubscribe with one click',
  },
  th: {
    subject: (n) => `คุณ${n} ยังมองหาผู้ช่วยอยู่ไหม?`,
    heading: 'ยังมองหาผู้ช่วยอยู่ไหม?',
    intro: (n, weeks) =>
      `สวัสดีค่ะคุณ${n} คุณสมัคร ThaiHelper เมื่อประมาณ ${weeks} สัปดาห์ที่แล้ว และโปรไฟล์ของคุณยังระบุว่ากำลังมองหาผู้ช่วยอยู่`,
    why: 'ผู้ช่วยจะเห็นข้อความนี้และติดต่อคุณ หากคุณหาคนได้แล้ว เพียงกดปุ่มด้านล่างหนึ่งครั้ง ข้อความก็จะหยุด และเราจะได้รู้ว่าเว็บไซต์นี้ช่วยคุณได้จริงหรือไม่',
    still: 'ใช่ ยังหาอยู่',
    here: 'ฉันหาคนได้แล้วบน ThaiHelper',
    elsewhere: 'ฉันหาคนได้จากที่อื่น',
    stop: 'ตอนนี้ไม่หาแล้ว',
    footer_note: 'กดครั้งเดียว ไม่ต้องเข้าสู่ระบบ เปลี่ยนได้ทุกเมื่อในแดชบอร์ดของคุณ',
    unsub: 'ไม่ต้องการอีเมลเหล่านี้?',
    unsub_link: 'ยกเลิกการรับอีเมลด้วยคลิกเดียว',
  },
};

/**
 * @param {object} p
 * @param {string} p.firstName
 * @param {string} p.email
 * @param {number} p.weeksSinceSignup
 * @param {object} p.links           { still_searching, found_here, found_elsewhere, not_looking }
 * @param {string} [p.unsubscribeUrl]
 * @param {'en'|'th'} [p.lang]
 */
export async function sendStatusCheckinEmail({
  firstName, email, weeksSinceSignup, links, unsubscribeUrl, lang = 'en',
}) {
  const t = L[lang === 'th' ? 'th' : 'en'];
  const name = firstName || (lang === 'th' ? 'ผู้ใช้' : 'there');
  const weeks = Math.max(1, Math.round(weeksSinceSignup || 4));

  const button = (href, label, primary) => `
    <tr><td style="padding:0 0 10px;">
      <a href="${href}" style="display:block;text-align:center;padding:14px 20px;border-radius:10px;
        font-size:15px;font-weight:700;text-decoration:none;
        ${primary
          ? 'background:#006a62;color:#ffffff;'
          : 'background:#ffffff;color:#1B3A4B;border:2px solid #E2ECF0;'}">
        ${esc(label)}
      </a>
    </td></tr>`;

  const html = `
<!DOCTYPE html>
<html lang="${lang === 'th' ? 'th' : 'en'}">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 14px;">${esc(t.heading)}</h1>
      <p style="font-size:15px;color:#444;margin:0 0 12px;line-height:1.6;">${esc(t.intro(name, weeks))}</p>
      <p style="font-size:15px;color:#666;margin:0 0 26px;line-height:1.6;">${esc(t.why)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${button(links.still_searching, t.still, true)}
        ${button(links.found_here, t.here, false)}
        ${button(links.found_elsewhere, t.elsewhere, false)}
        ${button(links.not_looking, t.stop, false)}
      </table>
      <p style="font-size:12px;color:#999;margin:18px 0 0;text-align:center;line-height:1.5;">${esc(t.footer_note)}</p>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">ThaiHelper — Connecting families with trusted household staff in Thailand</p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms</a>
      </p>
      ${unsubscribeUrl ? `
      <p style="font-size:11px;color:#ccc;margin:12px 0 0;">
        ${esc(t.unsub)}
        <a href="${unsubscribeUrl}" style="color:#aaa;text-decoration:underline;">${esc(t.unsub_link)}</a>
      </p>` : ''}
    </div>
  </div>
</body>
</html>`;

  // Always a text part — see reference_email_auth_spf_dkim_dmarc: HTML-only
  // mail from this domain lands in spam often enough to matter.
  const text = `${t.heading}

${t.intro(name, weeks)}

${t.why}

- ${t.still}: ${links.still_searching}
- ${t.here}: ${links.found_here}
- ${t.elsewhere}: ${links.found_elsewhere}
- ${t.stop}: ${links.not_looking}

${t.footer_note}
${unsubscribeUrl ? `\n${t.unsub} ${unsubscribeUrl}` : ''}
ThaiHelper · https://thaihelper.app`;

  const headers = unsubscribeUrl
    ? {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      }
    : undefined;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>',
    to: email,
    subject: t.subject(name),
    html,
    text,
    headers,
  });
}
