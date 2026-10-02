/**
 * "Your listing does not say what the job is" — to families who named the
 * roles they want but never described any of them.
 *
 * NOT the same letter as incomplete-profile.js, and the difference matters.
 * That one goes to the nine accounts with no role at all: a listing that
 * cannot be found in a search, and an account we are willing to remove. These
 * 63 families DID say what they want — they are findable, they appear in the
 * right filters, and several are in live conversations. They are simply
 * invisible at the moment a helper decides whether to answer. So: no deadline,
 * no removal, nothing about their account being at risk. Nobody here has done
 * anything wrong.
 *
 * The number is the argument, and it is theirs, not ours. 30% of families with
 * no description never received a single reply from a helper, against 15% of
 * families who wrote one. Twice the silence. That is the whole reason to spend
 * two minutes, and it is more persuasive than anything we could assert.
 *
 * Required at signup since 2026-10-02, per role. This letter exists for the
 * accounts already in the database, where the form can no longer ask.
 *
 * Tone: a tip from someone who can see the data, not an instruction from a
 * platform. Short. The ask is one sentence and the link goes straight to the
 * dashboard.
 *
 * Bilingual EN + TH. Every one of these 63 accounts has preferred_language
 * 'en' today, but a family writing in Thai is ordinary here and the Thai half
 * costs nothing — unlike incomplete-profile.js, which was written English-only
 * for an audience that was checked and was entirely English.
 *
 * NEVER imply we check identity documents (see feedback_no_id_verification).
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';
const DASHBOARD = 'https://thaihelper.app/employer-dashboard';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

// "คุณสมชาย" reads naturally; a bare "สวัสดีค่ะ" when we have no name does too.
// Same helper shape as phone-verification-request.js.
function thaiSalutation(firstName) {
  return firstName ? ` คุณ${firstName}` : '';
}

// Keeps the sentence grammatical when we have no role labels to name.
function rolesEnOrFallback(rolesEn) {
  return rolesEn || 'help at home';
}

/**
 * @param {object} opts
 * @param {string} opts.firstName
 * @param {string[]} [opts.roles]  the categories they ticked, as English
 *   labels, so the letter can name them back. Omitted → generic wording.
 */
export function buildMissingJobText({ firstName, roles = [] }) {
  const name = firstName || 'there';
  const th = thaiSalutation(firstName);

  // Naming their own roles back is what makes this read as written to them
  // rather than sent to a list. Falls back cleanly when we have nothing.
  const roleList = roles.filter(Boolean);
  const rolesEn = roleList.length
    ? roleList.length === 1
      ? roleList[0]
      : `${roleList.slice(0, -1).join(', ')} and ${roleList[roleList.length - 1]}`
    : null;

  const subject = 'Your ThaiHelper listing gets twice the replies with one paragraph';

  const text = `Hi ${name},

You are listed as looking for ${rolesEnOrFallback(rolesEn)}, so helpers can find you. What your listing does not say is what the job actually is.

We looked at every family on the platform: those with a description of the job get a reply from a helper far more often. 30% of listings without one never hear from anybody at all — against 15% of the ones that have it. Same families, same cities, twice the silence.

It is one short paragraph per role, and it is the thing helpers read before deciding whether to write to you. Things worth saying: how many hours or which days, how many children and their ages, whether it is live-in or live-out, and anything that would make somebody say yes or no before they message.

You can add it here, it takes two minutes: ${DASHBOARD}

No deadline and nothing happens if you don't — your account and your conversations are unaffected. It just works much better with it.

— The ThaiHelper team
${SUPPORT}

──────────

สวัสดีค่ะ${th}

โปรไฟล์ของคุณระบุว่ากำลังมองหาผู้ช่วยแล้ว ผู้ช่วยจึงค้นหาคุณเจอ แต่ประกาศของคุณยังไม่ได้บอกว่างานที่ต้องการคืออะไร

เราดูข้อมูลของทุกครอบครัวบนแพลตฟอร์ม ครอบครัวที่เขียนรายละเอียดงานได้รับการตอบกลับบ่อยกว่ามาก ประกาศที่ไม่มีรายละเอียด 30% ไม่ได้รับการติดต่อเลยแม้แต่รายเดียว เทียบกับ 15% ของประกาศที่มีรายละเอียด

ใช้เวลาแค่ย่อหน้าสั้นๆ ต่อหนึ่งตำแหน่ง และนี่คือสิ่งที่ผู้ช่วยอ่านก่อนตัดสินใจทักหาคุณ สิ่งที่ควรบอก เช่น ทำงานกี่ชั่วโมงหรือวันไหนบ้าง มีลูกกี่คนอายุเท่าไร อยู่ประจำหรือไป-กลับ และข้อมูลที่ช่วยให้เขาตัดสินใจได้ก่อนส่งข้อความ

เพิ่มได้ที่นี่ ใช้เวลาสองนาที: ${DASHBOARD}

ไม่มีกำหนดเวลาและไม่มีผลใดๆ หากคุณไม่ทำ บัญชีและการสนทนาของคุณไม่เปลี่ยนแปลง เพียงแต่จะได้ผลดีกว่ามากถ้ามีรายละเอียด

— ทีมงาน ThaiHelper
${SUPPORT}`;

  const p = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;"';
  const pTh = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.75;"';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#222;">
<div style="max-width:540px;margin:32px auto;padding:0 18px;">
  <div style="background:#fff;border-radius:14px;padding:28px;border-top:4px solid #F4A261;">

    <p ${p}>Hi ${esc(name)},</p>
    <p ${p}>You are listed as looking for ${esc(rolesEnOrFallback(rolesEn))}, so helpers can find you. What your listing does not say is <strong>what the job actually is</strong>.</p>

    <div style="margin:20px 0;padding:16px;background:#fdf4e7;border-left:4px solid #F4A261;border-radius:6px;">
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.65;">
        We looked at every family on the platform. <strong>30% of listings with no description never hear from anybody at all</strong> — against 15% of the ones that have it. Same families, same cities, twice the silence.
      </p>
    </div>

    <p ${p}>It is one short paragraph per role, and it is what helpers read before deciding whether to write to you. Worth saying: how many hours or which days, how many children and their ages, live-in or live-out, and anything that would make somebody say yes or no before they message.</p>

    <p style="margin:0 0 20px;">
      <a href="${DASHBOARD}" style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Add the job description</a>
    </p>

    <p ${p}>No deadline and nothing happens if you don't — your account and your conversations are unaffected. It just works much better with it.</p>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:26px 0;">

    <p ${pTh}>สวัสดีค่ะ${esc(th)}</p>
    <p ${pTh}>โปรไฟล์ของคุณระบุว่ากำลังมองหาผู้ช่วยแล้ว ผู้ช่วยจึงค้นหาคุณเจอ แต่ประกาศของคุณ<strong>ยังไม่ได้บอกว่างานที่ต้องการคืออะไร</strong></p>
    <p ${pTh}>เราดูข้อมูลของทุกครอบครัวบนแพลตฟอร์ม ประกาศที่ไม่มีรายละเอียดงาน <strong>30% ไม่ได้รับการติดต่อเลย</strong> เทียบกับ 15% ของประกาศที่มีรายละเอียด</p>
    <p ${pTh}>ใช้เวลาแค่ย่อหน้าสั้นๆ ต่อหนึ่งตำแหน่ง เช่น ทำงานกี่ชั่วโมงหรือวันไหน มีลูกกี่คนอายุเท่าไร อยู่ประจำหรือไป-กลับ</p>

    <p style="margin:0 0 20px;">
      <a href="${DASHBOARD}" style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">เพิ่มรายละเอียดงาน</a>
    </p>

    <p ${pTh}>ไม่มีกำหนดเวลาและไม่มีผลใดๆ หากคุณไม่ทำ บัญชีและการสนทนาของคุณไม่เปลี่ยนแปลง</p>

    <p style="margin:24px 0 0;font-size:14px;color:#666;">— The ThaiHelper team · <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a></p>

  </div>
</div>
</body></html>`;

  return { subject, text, html };
}

export async function sendMissingJobText({ firstName, email, roles }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildMissingJobText({ firstName, roles });
  // Always include the text part — mails without one land in spam far more
  // often, and most of these recipients are on Gmail.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
