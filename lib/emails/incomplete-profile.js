/**
 * "Your listing says nothing" — to families who registered without naming a
 * single role they are looking for.
 *
 * Until 2026-09-28 looking_for was optional, so an account could go live
 * showing a name and a city and nothing else. Eleven families did that. Two of
 * them are suspended today — EMP-6J3VUE, the "Support ThaiHelper" phishing
 * run, and an earlier scam family — which is 18% against 2.2% for the 178
 * families who said what they wanted.
 *
 * That is why the field is now required at signup. This mail is for the ones
 * already in the database, where the form can no longer ask.
 *
 * Tone: most of these are not scammers, they are people who got interrupted
 * halfway through a form. So the mail leads with what they lose (nobody can
 * find them, so no replies) and only then mentions removal, with a date. The
 * deadline is the point of the mail, but it is not the first thing they read.
 *
 * NOW BILINGUAL (2026-10-02). It was English-only on the grounds that every
 * account in this state had preferred_language 'en' — still true today. But
 * that field is the UI language somebody left at its default, not evidence
 * they read English, and two of the nine current recipients wrote their name
 * in Thai. This is the one letter here that warns of removal, and a warning
 * the reader cannot read is the worst thing in the set: they lose the account
 * without ever knowing they were asked. The Thai half costs nothing.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';
const SITE = 'https://thaihelper.app';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

function thaiSalutation(firstName) {
  return firstName ? ` คุณ${firstName}` : '';
}

/**
 * @param {object} opts
 * @param {string} opts.firstName
 * @param {number} opts.days  grace period before the account is removed
 */
export function buildIncompleteProfile({ firstName, days = 7 }) {
  const name = firstName || 'there';
  const th = thaiSalutation(firstName);

  const subject = 'Your ThaiHelper listing is missing one thing / ประกาศของคุณยังขาดสิ่งสำคัญ';

  const text = `Hi ${name},

Thanks for signing up. Your account is active, but your listing is missing the most important part: you haven't said what kind of help you are looking for.

Right now helpers see a name and a city. Nobody can find you in a search, and nobody can tell what the job is — so you will not get any replies.

It takes a minute to fix. Log in at ${SITE}/login, open your profile, and tick at least one category: nanny, housekeeper, chef, driver, gardener, elder care, tutor or pet sitter. A short description of the job helps a lot too — that is what helpers read before they write to you.

If the listing is still empty in ${days} days, we will remove the account. We keep the family list clean so the helpers browsing it find real jobs.

If you signed up by accident or changed your mind, just ignore this and the account will disappear on its own.

Jelena
Founder, thaihelper.app
${SUPPORT}

──────────

สวัสดีค่ะ${th}

ขอบคุณที่สมัครใช้งาน บัญชีของคุณใช้งานได้แล้ว แต่ประกาศของคุณยังขาดส่วนที่สำคัญที่สุด คือคุณยังไม่ได้ระบุว่ากำลังมองหาผู้ช่วยประเภทใด

ตอนนี้ผู้ช่วยเห็นเพียงชื่อและจังหวัดของคุณ ไม่มีใครค้นหาคุณเจอ และไม่มีใครรู้ว่างานคืออะไร คุณจึงจะไม่ได้รับการติดต่อเลย

แก้ไขได้ในหนึ่งนาที เข้าสู่ระบบที่ ${SITE}/login เปิดโปรไฟล์ แล้วเลือกอย่างน้อยหนึ่งประเภท เช่น พี่เลี้ยงเด็ก แม่บ้าน พ่อครัว คนขับรถ คนสวน ผู้ดูแลผู้สูงอายุ ครูสอนพิเศษ หรือผู้ดูแลสัตว์เลี้ยง การเขียนรายละเอียดงานสั้นๆ ก็ช่วยได้มาก เพราะนั่นคือสิ่งที่ผู้ช่วยอ่านก่อนตัดสินใจทักหาคุณ

หากประกาศยังว่างอยู่ภายใน ${days} วัน เราจะลบบัญชีนี้ออก เพื่อให้รายชื่อครอบครัวที่ผู้ช่วยเห็นเป็นงานจริงทั้งหมด

หากคุณสมัครโดยไม่ได้ตั้งใจหรือเปลี่ยนใจแล้ว ไม่ต้องทำอะไร บัญชีจะถูกลบไปเอง

เจเลนา
ผู้ก่อตั้ง thaihelper.app
${SUPPORT}`;

  const p = 'style="margin:0 0 14px;"';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;line-height:1.65;color:#222;">
<div style="max-width:540px;margin:32px auto;padding:0 18px;">
  <div style="background:#fff;border-radius:14px;padding:28px;border-top:4px solid #F4A261;">

    <p ${p}>Hi ${esc(name)},</p>
    <p ${p}>Thanks for signing up. Your account is active, but your listing is missing the most important part: <strong>you haven't said what kind of help you are looking for.</strong></p>
    <p ${p}>Right now helpers see a name and a city. Nobody can find you in a search, and nobody can tell what the job is — so you will not get any replies.</p>

    <div style="background:#fdf4e7;border-left:3px solid #F4A261;padding:14px 18px;border-radius:8px;margin:0 0 16px;">
      It takes a minute to fix. Log in, open your profile, and tick at least one category: nanny, housekeeper, chef, driver, gardener, elder care, tutor or pet sitter. A short description of the job helps a lot too — that is what helpers read before they write to you.
    </div>

    <p style="margin:0 0 20px;">
      <a href="${SITE}/login" style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Complete my listing</a>
    </p>

    <p ${p}>If the listing is still empty in ${days} days, we will remove the account. We keep the family list clean so the helpers browsing it find real jobs.</p>
    <p ${p}>If you signed up by accident or changed your mind, just ignore this and the account will disappear on its own.</p>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:26px 0;">

    <p style="margin:0 0 14px;line-height:1.75;">สวัสดีค่ะ${esc(th)}</p>
    <p style="margin:0 0 14px;line-height:1.75;">ขอบคุณที่สมัครใช้งาน บัญชีของคุณใช้งานได้แล้ว แต่ประกาศของคุณ<strong>ยังไม่ได้ระบุว่ากำลังมองหาผู้ช่วยประเภทใด</strong></p>
    <p style="margin:0 0 14px;line-height:1.75;">ตอนนี้ผู้ช่วยเห็นเพียงชื่อและจังหวัดของคุณ ไม่มีใครค้นหาคุณเจอ และไม่มีใครรู้ว่างานคืออะไร คุณจึงจะไม่ได้รับการติดต่อเลย</p>

    <p style="margin:0 0 20px;">
      <a href="${SITE}/login" style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">เพิ่มรายละเอียดในประกาศ</a>
    </p>

    <p style="margin:0 0 14px;line-height:1.75;">หากประกาศยังว่างอยู่ภายใน ${days} วัน เราจะลบบัญชีนี้ออก เพื่อให้รายชื่อครอบครัวที่ผู้ช่วยเห็นเป็นงานจริงทั้งหมด</p>

    <p style="margin:0;">Jelena<br><span style="color:#666;font-size:14px;">Founder, thaihelper.app · <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a></span></p>

  </div>
</div>
</body></html>`;

  return { subject, text, html };
}

export async function sendIncompleteProfile({ firstName, email, days = 7 }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildIncompleteProfile({ firstName, days });
  // Always include the text part — see the SPF/DKIM/DMARC notes.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
