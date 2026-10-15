/**
 * "Add a description by the 21st or your listing comes out of the list."
 *
 * The second letter to these families, and the first one with a consequence.
 * On 2026-10-05 they were sent missing-job-text.js, which argued from their
 * own numbers — 30% of listings without a description never hear from
 * anybody, against 15% of the ones that have it — and asked nicely. Measured
 * nine days later: ONE of 62 wrote a description, while 16 of them logged in.
 * Being told it is in their interest does not work. So this one says what
 * happens instead.
 *
 * THE CONSEQUENCE IS PROPORTIONATE AND REVERSIBLE, which is what makes it
 * sayable. Nothing is deleted, no account is closed, conversations stay open,
 * replies keep working, and the listing comes back by itself the moment a
 * description exists — see hiddenForMissingJobText() in lib/access.js, which
 * derives it rather than writing a flag somebody has to undo. An empty
 * listing is not a punishment to be reversed; it is a page with nothing on it.
 *
 * It is also the honest version of what is already true: a listing that says
 * only a name and a city is not findable in any useful sense. We are removing
 * something that was never doing its job.
 *
 * CONDITIONAL on whether they are currently visible. 13 of the 68 recipients
 * have already hidden themselves from their own dashboard; telling them their
 * listing "will be hidden" would be false, so they are told it will stay
 * hidden until there is a description. The caller must pass it.
 *
 * The date is passed in rather than computed here, so that the letter and
 * JOB_TEXT_REQUIRED_FROM cannot drift apart — one of them being wrong is worse
 * than either being late.
 *
 * Bilingual EN + TH. All 68 have preferred_language 'en', which is a default
 * nobody changed rather than evidence, and this letter has a deadline in it.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';
const DASHBOARD = 'https://thaihelper.app/employer-dashboard';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

// Formatted in UTC on both sides, so the two halves of the letter can never
// name different days for a reader near a date boundary.
function formatDate(ts, lang) {
  const d = new Date(ts);
  if (lang === 'th') {
    return `${d.getUTCDate()} ${TH_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
  }
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/**
 * @param {object} opts
 * @param {string} opts.firstName
 * @param {number|Date} opts.deadline      pass JOB_TEXT_REQUIRED_FROM
 * @param {boolean} opts.currentlyVisible  false when they have already hidden
 *   themselves — the sentence about being hidden would otherwise be untrue.
 */
export function buildJobTextDeadline({ firstName, deadline, currentlyVisible = true }) {
  const name = firstName || 'there';
  const th = firstName ? ` คุณ${firstName}` : '';
  const dEn = formatDate(deadline, 'en');
  const dTh = formatDate(deadline, 'th');

  const subject = currentlyVisible
    ? `Your listing needs a job description by ${dEn}`
    : `Add a job description to bring your listing back`;

  const consequenceEn = currentlyVisible
    ? `From ${dEn}, a listing with no description will not be shown in the family list any more. It comes back the moment you add one — nothing is deleted and you do not have to tell us.`
    : `Your listing is hidden at the moment. From ${dEn}, a listing with no description stays out of the family list even after you make it visible again — so it is worth adding one before you come back.`;

  const consequenceTh = currentlyVisible
    ? `ตั้งแต่วันที่ ${dTh} ประกาศที่ไม่มีรายละเอียดงานจะไม่แสดงในรายชื่อครอบครัวอีกต่อไป และจะกลับมาแสดงทันทีที่คุณเพิ่มรายละเอียด ไม่มีอะไรถูกลบ และคุณไม่ต้องแจ้งเรา`
    : `ขณะนี้ประกาศของคุณถูกซ่อนอยู่ ตั้งแต่วันที่ ${dTh} ประกาศที่ไม่มีรายละเอียดงานจะไม่แสดงในรายชื่อ แม้คุณจะเปิดให้แสดงอีกครั้งก็ตาม จึงควรเพิ่มรายละเอียดก่อนกลับมา`;

  const text = `Hi ${name},

Your ThaiHelper listing still has no description of the job.

${consequenceEn}

What does not change: your account stays open, your conversations stay open,
and you can keep replying to everyone you are already talking to. This is only
about whether an empty listing appears in the list helpers browse.

Why we are doing it: a listing with a name and a city and nothing else cannot
be answered. Helpers read the description to decide whether to write to you —
30% of listings without one never hear from anybody at all, against 15% of
the ones that have it.

It takes two minutes: ${DASHBOARD}
One or two sentences per role is enough. How many hours or which days, how
many children and their ages, live-in or live-out.

If you have already found someone, or no longer need help, you can ignore this.

Jelena
Founder, thaihelper.app
${SUPPORT}

──────────

สวัสดีค่ะ${th}

ประกาศของคุณบน ThaiHelper ยังไม่มีรายละเอียดงาน

${consequenceTh}

สิ่งที่ไม่เปลี่ยน: บัญชีของคุณยังใช้งานได้ การสนทนาที่มีอยู่ยังเปิดอยู่ และคุณยังตอบทุกคนที่กำลังคุยอยู่ได้ตามปกติ เรื่องนี้เกี่ยวกับการแสดงประกาศในรายชื่อเท่านั้น

เหตุผล: ประกาศที่มีเพียงชื่อและจังหวัดไม่มีใครตอบได้ ผู้ช่วยอ่านรายละเอียดงานเพื่อตัดสินใจว่าจะทักหาคุณหรือไม่ ประกาศที่ไม่มีรายละเอียด 30% ไม่ได้รับการติดต่อเลย เทียบกับ 15% ของประกาศที่มีรายละเอียด

ใช้เวลาสองนาที: ${DASHBOARD}
เขียนหนึ่งถึงสองประโยคต่อหนึ่งตำแหน่งก็พอ เช่น ทำงานกี่ชั่วโมงหรือวันไหน มีลูกกี่คนอายุเท่าไร อยู่ประจำหรือไป-กลับ

หากคุณหาคนได้แล้วหรือไม่ต้องการผู้ช่วยแล้ว ไม่ต้องทำอะไรค่ะ

เจเลนา
ผู้ก่อตั้ง thaihelper.app
${SUPPORT}`;

  const p = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;"';
  const pTh = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.8;"';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#222;">
<div style="max-width:540px;margin:32px auto;padding:0 18px;">
  <div style="background:#fff;border-radius:14px;padding:28px;border-top:4px solid #F4A261;">

    <p ${p}>Hi ${esc(name)},</p>
    <p ${p}>Your ThaiHelper listing still has <strong>no description of the job</strong>.</p>

    <div style="background:#fdf4e7;border-left:4px solid #F4A261;padding:14px 18px;border-radius:8px;margin:0 0 18px;font-size:14px;line-height:1.65;color:#1a1a1a;">
      ${esc(consequenceEn)}
    </div>

    <p ${p}><strong>What does not change:</strong> your account stays open, your conversations stay open, and you can keep replying to everyone you are already talking to. This is only about whether an empty listing appears in the list helpers browse.</p>
    <p ${p}>A listing with a name and a city and nothing else cannot be answered. Helpers read the description to decide whether to write to you — <strong>30% of listings without one never hear from anybody</strong>, against 15% of the ones that have it.</p>

    <p style="margin:0 0 20px;">
      <a href="${DASHBOARD}" style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Add the job description</a>
    </p>
    <p ${p}>One or two sentences per role is enough: how many hours or which days, how many children and their ages, live-in or live-out.</p>
    <p ${p}>If you have already found someone, or no longer need help, you can ignore this.</p>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:26px 0;">

    <p ${pTh}>สวัสดีค่ะ${esc(th)}</p>
    <p ${pTh}>ประกาศของคุณบน ThaiHelper <strong>ยังไม่มีรายละเอียดงาน</strong></p>
    <div style="background:#fdf4e7;border-left:4px solid #F4A261;padding:14px 18px;border-radius:8px;margin:0 0 18px;font-size:14px;line-height:1.8;color:#1a1a1a;">
      ${esc(consequenceTh)}
    </div>
    <p ${pTh}><strong>สิ่งที่ไม่เปลี่ยน:</strong> บัญชีและการสนทนาของคุณยังเปิดอยู่ตามปกติ เรื่องนี้เกี่ยวกับการแสดงประกาศในรายชื่อเท่านั้น</p>

    <p style="margin:0 0 20px;">
      <a href="${DASHBOARD}" style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">เพิ่มรายละเอียดงาน</a>
    </p>
    <p ${pTh}>หากคุณหาคนได้แล้วหรือไม่ต้องการผู้ช่วยแล้ว ไม่ต้องทำอะไรค่ะ</p>

    <p style="margin:24px 0 0;">Jelena<br><span style="color:#666;font-size:14px;">Founder, thaihelper.app · <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a></span></p>

  </div>
</div>
</body></html>`;

  return { subject, text, html };
}

export async function sendJobTextDeadline({ firstName, email, deadline, currentlyVisible }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildJobTextDeadline({ firstName, deadline, currentlyVisible });
  // Always include the text part — see the SPF/DKIM/DMARC notes.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
