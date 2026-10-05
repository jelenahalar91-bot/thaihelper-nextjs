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
 * NO DELETION THREAT (changed 2026-10-05, Jelena's call). The earlier draft
 * said the account would be removed if the listing stayed empty. Two things
 * were wrong with that. A threat you are not certain you will carry out is
 * worth less than nothing — the next warning from us is then also just words.
 * And it was aimed at the wrong people: these are mostly not scammers, they
 * are people who were interrupted halfway through a form, and the two who did
 * turn out to be scammers were caught by what they wrote, not by an empty
 * field.
 *
 * What replaced it is simply true, and therefore does not need enforcing: to
 * message a helper you have not spoken to before, you need a verified phone
 * number. That is already the rule (canStartConversation in lib/access.js), it
 * is the thing actually standing between most of these accounts and a reply,
 * and saying so is information rather than a threat.
 *
 * CONDITIONAL, because one of the eight current recipients has already
 * verified a number and was online the day this was written. Telling somebody
 * to do a thing they have done is how a mail gets filed as noise — hence the
 * phoneVerified flag, and the caller must pass it.
 *
 * Bilingual EN + TH. Every account in this state has preferred_language 'en',
 * but that is a UI default somebody never changed rather than evidence they
 * read English, and two of them wrote their name in Thai.
 *
 * NEVER imply we check identity documents.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';
const SITE = 'https://thaihelper.app';
const DASHBOARD = 'https://thaihelper.app/employer-dashboard';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

function thaiSalutation(firstName) {
  return firstName ? ` คุณ${firstName}` : '';
}

/**
 * @param {object} opts
 * @param {string} opts.firstName
 * @param {boolean} opts.phoneVerified  whether this account already has a
 *   verified number. Required: the phone paragraph is included only when it
 *   is false, and defaulting it would silently tell verified people to verify.
 */
export function buildIncompleteProfile({ firstName, phoneVerified = false }) {
  const name = firstName || 'there';
  const th = thaiSalutation(firstName);

  const subject = 'Your ThaiHelper listing is missing one thing / ประกาศของคุณยังขาดสิ่งสำคัญ';

  const phoneEn = phoneVerified ? '' : `
One more thing, so you are not surprised by it: to message a helper you have not spoken to before, your phone number needs to be verified. It takes two minutes in your dashboard — we text you a code. Replying to someone who wrote to you first does not need it.
`;

  const phoneTh = phoneVerified ? '' : `
อีกเรื่องหนึ่ง เพื่อไม่ให้คุณแปลกใจภายหลัง การทักหาผู้ช่วยคนใหม่ที่ยังไม่เคยคุยกันต้องยืนยันเบอร์โทรศัพท์ก่อน ใช้เวลาสองนาทีในหน้าแดชบอร์ด เราจะส่งรหัสให้ทาง SMS ส่วนการตอบกลับคนที่ทักคุณมาก่อนไม่ต้องยืนยัน
`;

  const text = `Hi ${name},

Thanks for signing up. Your account is active, but your listing is missing the most important part: you haven't said what kind of help you are looking for.

Right now helpers see a name and a city. Nobody can find you in a search, and nobody can tell what the job is — so you will not get any replies.

It takes a minute to fix. Log in at ${SITE}/login, open your profile, and tick at least one category: nanny, housekeeper, chef, driver, gardener, elder care, tutor or pet sitter. A short description of the job helps a lot too — that is what helpers read before they write to you.
${phoneEn}
If you no longer need help, you can simply ignore this.

Jelena
Founder, thaihelper.app
${SUPPORT}

──────────

สวัสดีค่ะ${th}

ขอบคุณที่สมัครใช้งาน บัญชีของคุณใช้งานได้แล้ว แต่ประกาศของคุณยังขาดส่วนที่สำคัญที่สุด คือคุณยังไม่ได้ระบุว่ากำลังมองหาผู้ช่วยประเภทใด

ตอนนี้ผู้ช่วยเห็นเพียงชื่อและจังหวัดของคุณ ไม่มีใครค้นหาคุณเจอ และไม่มีใครรู้ว่างานคืออะไร คุณจึงจะไม่ได้รับการติดต่อเลย

แก้ไขได้ในหนึ่งนาที เข้าสู่ระบบที่ ${SITE}/login เปิดโปรไฟล์ แล้วเลือกอย่างน้อยหนึ่งประเภท เช่น พี่เลี้ยงเด็ก แม่บ้าน พ่อครัว คนขับรถ คนสวน ผู้ดูแลผู้สูงอายุ ครูสอนพิเศษ หรือผู้ดูแลสัตว์เลี้ยง การเขียนรายละเอียดงานสั้นๆ ก็ช่วยได้มาก เพราะนั่นคือสิ่งที่ผู้ช่วยอ่านก่อนตัดสินใจทักหาคุณ
${phoneTh}
หากคุณไม่ต้องการผู้ช่วยแล้ว ไม่ต้องทำอะไรค่ะ

เจเลนา
ผู้ก่อตั้ง thaihelper.app
${SUPPORT}`;

  const p = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;"';
  const pTh = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.75;"';

  const phoneBlockEn = phoneVerified ? '' : `
    <div style="margin:20px 0;padding:16px;background:#eef7f5;border-left:4px solid #006a62;border-radius:6px;">
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.65;">
        One more thing, so it does not surprise you: to message a helper you have not spoken to before, your <strong>phone number needs to be verified</strong>. Two minutes in your dashboard — we text you a code. Replying to someone who wrote to you first does not need it.
      </p>
    </div>`;

  const phoneBlockTh = phoneVerified ? '' : `
    <div style="margin:20px 0;padding:16px;background:#eef7f5;border-left:4px solid #006a62;border-radius:6px;">
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.75;">
        อีกเรื่องหนึ่ง การทักหาผู้ช่วยคนใหม่ต้อง<strong>ยืนยันเบอร์โทรศัพท์</strong>ก่อน ใช้เวลาสองนาทีในหน้าแดชบอร์ด เราจะส่งรหัสให้ทาง SMS ส่วนการตอบกลับคนที่ทักคุณมาก่อนไม่ต้องยืนยัน
      </p>
    </div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#222;">
<div style="max-width:540px;margin:32px auto;padding:0 18px;">
  <div style="background:#fff;border-radius:14px;padding:28px;border-top:4px solid #F4A261;">

    <p ${p}>Hi ${esc(name)},</p>
    <p ${p}>Thanks for signing up. Your account is active, but your listing is missing the most important part: <strong>you haven't said what kind of help you are looking for.</strong></p>
    <p ${p}>Right now helpers see a name and a city. Nobody can find you in a search, and nobody can tell what the job is — so you will not get any replies.</p>

    <div style="background:#fdf4e7;border-left:3px solid #F4A261;padding:14px 18px;border-radius:8px;margin:0 0 16px;font-size:14px;line-height:1.65;">
      It takes a minute to fix. Log in, open your profile, and tick at least one category: nanny, housekeeper, chef, driver, gardener, elder care, tutor or pet sitter. A short description of the job helps a lot too — that is what helpers read before they write to you.
    </div>

    <p style="margin:0 0 20px;">
      <a href="${SITE}/login" style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Complete my listing</a>
    </p>
${phoneBlockEn}
    <p ${p}>If you no longer need help, you can simply ignore this.</p>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:26px 0;">

    <p ${pTh}>สวัสดีค่ะ${esc(th)}</p>
    <p ${pTh}>ขอบคุณที่สมัครใช้งาน บัญชีของคุณใช้งานได้แล้ว แต่ประกาศของคุณ<strong>ยังไม่ได้ระบุว่ากำลังมองหาผู้ช่วยประเภทใด</strong></p>
    <p ${pTh}>ตอนนี้ผู้ช่วยเห็นเพียงชื่อและจังหวัดของคุณ ไม่มีใครค้นหาคุณเจอ และไม่มีใครรู้ว่างานคืออะไร คุณจึงจะไม่ได้รับการติดต่อเลย</p>

    <p style="margin:0 0 20px;">
      <a href="${SITE}/login" style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">เพิ่มรายละเอียดในประกาศ</a>
    </p>
${phoneBlockTh}
    <p ${pTh}>หากคุณไม่ต้องการผู้ช่วยแล้ว ไม่ต้องทำอะไรค่ะ</p>

    <p style="margin:24px 0 0;">Jelena<br><span style="color:#666;font-size:14px;">Founder, thaihelper.app · <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a></span></p>

  </div>
</div>
</body></html>`;

  return { subject, text, html };
}

export async function sendIncompleteProfile({ firstName, email, phoneVerified }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildIncompleteProfile({ firstName, phoneVerified });
  // Always include the text part — see the SPF/DKIM/DMARC notes.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
