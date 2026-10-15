/**
 * "Still no luck? Here are agencies that serve your city."
 *
 * Sent once, two to three weeks after signup, and only to a family that
 * ticked the box at registration saying we may suggest agencies. They are
 * still searching and have not told us they hired anyone.
 *
 * The agency never learns the family exists. We show what each one charges,
 * as published on its own website, and the family decides whether to click.
 * That click is counted (directory_click_events, source 'email') and is the
 * number this whole directory will eventually be sold on — see
 * project_hiring_outcomes_and_agency_plan_2026-10-14.
 *
 * Tone: not an apology and not a goodbye. Plenty of families use an agency
 * for one role and this site for another, and agencies are future partners,
 * not rivals (feedback_agencies_are_customers_not_competitors). The mail
 * says what things cost and gets out of the way.
 *
 * One email per family, ever — agency_referral_sent_at.
 */

import { Resend } from 'resend';
import { formatPackagePrice, cheapestPackage, paymentFlowShort } from '../directory-pricing';

const resend = new Resend(process.env.RESEND_API_KEY);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const L = {
  en: {
    subject: (city) => `Agencies in ${city}, with what they charge`,
    heading: 'Still looking? Here is what an agency would cost',
    intro: (n, city) =>
      `Hi ${n}, you said at signup that we could point you to agencies if you did not find someone here. You are still searching, so here are the ones that serve ${city} and publish their fees.`,
    disclaimer:
      'We are not an agency and we take nothing from these. Prices are the ones each agency publishes on its own website, checked on the date shown on their page — confirm before you sign anything, and ask whether the helper’s salary is included.',
    col_from: 'From',
    col_pays: 'Who you pay',
    view_all: (city) => `See all agencies for ${city} →`,
    keep_looking: 'Keep looking on ThaiHelper →',
    keep_looking_note: 'New helpers register every day, and your profile stays live either way.',
    unsub: 'Don’t want these emails?',
    unsub_link: 'Unsubscribe with one click',
  },
  th: {
    subject: (city) => `เอเจนซี่ใน${city} พร้อมค่าบริการ`,
    heading: 'ยังหาไม่ได้? นี่คือค่าใช้จ่ายหากใช้เอเจนซี่',
    intro: (n, city) =>
      `สวัสดีค่ะคุณ${n} ตอนสมัครคุณระบุว่าให้เราแนะนำเอเจนซี่ได้หากยังหาคนไม่ได้ ตอนนี้คุณยังหาอยู่ นี่คือเอเจนซี่ที่ให้บริการใน${city} และประกาศค่าบริการไว้`,
    disclaimer:
      'เราไม่ใช่เอเจนซี่และไม่ได้รับค่าตอบแทนใด ๆ จากรายชื่อเหล่านี้ ราคาเป็นราคาที่แต่ละเอเจนซี่ประกาศบนเว็บไซต์ของตนเอง โปรดยืนยันก่อนเซ็นสัญญา และสอบถามว่ารวมเงินเดือนผู้ช่วยหรือไม่',
    col_from: 'เริ่มต้น',
    col_pays: 'คุณจ่ายให้ใคร',
    view_all: (city) => `ดูเอเจนซี่ทั้งหมดใน${city} →`,
    keep_looking: 'ค้นหาผู้ช่วยต่อบน ThaiHelper →',
    keep_looking_note: 'มีผู้ช่วยสมัครใหม่ทุกวัน และโปรไฟล์ของคุณยังใช้งานอยู่',
    unsub: 'ไม่ต้องการอีเมลเหล่านี้?',
    unsub_link: 'ยกเลิกการรับอีเมลด้วยคลิกเดียว',
  },
};

/**
 * @param {object} p
 * @param {string} p.firstName
 * @param {string} p.email
 * @param {string} p.cityLabel            display name, e.g. "Phuket"
 * @param {string} p.citySlug             for the directory link
 * @param {Array}  p.listings             directory rows (camelCase, with pricing)
 * @param {string} [p.unsubscribeUrl]
 * @param {'en'|'th'} [p.lang]
 */
export async function sendAgencySuggestionsEmail({
  firstName, email, cityLabel, citySlug, listings, unsubscribeUrl, lang = 'en',
}) {
  const t = L[lang === 'th' ? 'th' : 'en'];
  const name = firstName || (lang === 'th' ? 'ผู้ใช้' : 'there');
  const city = cityLabel || 'Thailand';
  // source=email is what makes these clicks countable as ours later.
  const dirUrl = `https://thaihelper.app/directory?type=agency&city=${encodeURIComponent(citySlug)}&source=email`;
  const browseUrl = 'https://thaihelper.app/helpers?source=email';

  const rows = listings.map((l) => {
    const pkg = cheapestPackage(l.pricing);
    const price = pkg ? formatPackagePrice({ ...pkg, price_max_thb: null }, lang) : '';
    const pays = paymentFlowShort(l.paymentFlow, lang);
    const url = `https://thaihelper.app/directory/${l.slug}?source=email`;
    return { name: l.name, price, pays, url };
  });

  const rowsHtml = rows.map((r) => `
    <tr>
      <td style="padding:14px 0;border-top:1px solid #eef2f4;">
        <a href="${r.url}" style="font-size:15px;font-weight:700;color:#006a62;text-decoration:none;">${esc(r.name)}</a>
        <div style="font-size:13px;color:#777;margin-top:3px;">${esc(r.pays)}</div>
      </td>
      <td style="padding:14px 0;border-top:1px solid #eef2f4;text-align:right;white-space:nowrap;vertical-align:top;">
        <span style="font-size:14px;font-weight:700;color:#1B3A4B;">${esc(r.price)}</span>
      </td>
    </tr>`).join('');

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
      <h1 style="font-size:21px;font-weight:700;color:#1a1a1a;margin:0 0 14px;line-height:1.35;">${esc(t.heading)}</h1>
      <p style="font-size:15px;color:#444;margin:0 0 22px;line-height:1.6;">${esc(t.intro(name, city))}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:8px;">
        <tr>
          <td style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9aa8b0;padding-bottom:4px;">${esc(city)}</td>
          <td style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9aa8b0;padding-bottom:4px;text-align:right;">${esc(t.col_from)}</td>
        </tr>
        ${rowsHtml}
      </table>

      <p style="margin:18px 0 26px;">
        <a href="${dirUrl}" style="font-size:14px;font-weight:700;color:#006a62;text-decoration:none;">${esc(t.view_all(city))}</a>
      </p>

      <div style="background:#f8faf9;border-radius:12px;padding:16px 18px;margin-bottom:24px;">
        <p style="font-size:12.5px;color:#777;margin:0;line-height:1.6;">${esc(t.disclaimer)}</p>
      </div>

      <div style="text-align:center;border-top:1px solid #eef2f4;padding-top:22px;">
        <a href="${browseUrl}" style="display:inline-block;padding:14px 28px;background:#006a62;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
          ${esc(t.keep_looking)}
        </a>
        <p style="font-size:12.5px;color:#999;margin:12px 0 0;line-height:1.5;">${esc(t.keep_looking_note)}</p>
      </div>
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

  const text = `${t.heading}

${t.intro(name, city)}

${rows.map(r => `- ${r.name} — ${r.price} (${r.pays})\n  ${r.url}`).join('\n')}

${t.view_all(city)} ${dirUrl}

${t.disclaimer}

${t.keep_looking} ${browseUrl}
${t.keep_looking_note}
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
    subject: t.subject(city),
    html,
    text,
    headers,
  });
}
