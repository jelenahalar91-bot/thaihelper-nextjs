/**
 * Ask everyone already on the platform to verify a phone number — September 2026.
 *
 * TWO AUDIENCES, TWO DIFFERENT LETTERS, AND THE DIFFERENCE IS THE POINT.
 *
 * Every scam this platform has had ran family -> helper: four accounts, four
 * fresh Gmail addresses, one person, pushing a LINE handoff at helpers looking
 * for work. Email verification never stopped it because a new email costs
 * nothing. A phone number is the first identity here that survives
 * re-registration, so families now have to have one.
 *
 * Helpers do not. They are the people being approached, not the ones doing the
 * approaching, and there are 953 of them holding up the supply side. For them
 * this is an offer: verify and families see a badge on your card. Nothing
 * happens if you ignore it. No deadline, no threat, no penalty — a letter that
 * frightens a nanny into thinking she is about to lose her profile would cost
 * far more than it could possibly protect.
 *
 * Families get a deadline, because for them it is the actual gate: unverified
 * after the date and the profile is hidden — no browsing, no messaging, not
 * even replying to a conversation already open. Hidden, NOT deleted: verifying
 * brings everything back, conversations and all, the moment they do it.
 *
 * Tone for the family letter: they have done nothing wrong and most of them
 * are real families who will be annoyed. So — what changed, why, exactly what
 * happens and when, and how to undo it in two minutes. No implication that
 * they are under suspicion.
 *
 * NEVER SAY OR IMPLY WE CHECK IDENTITY DOCUMENTS. We verify an email and a
 * phone. That is all, and the copy must not suggest otherwise.
 *
 * Bilingual EN + TH — most helpers read Thai first, most families read English.
 * Both letters carry both languages anyway, since either side may be either.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

// Thai runs คุณ straight into a Thai name but needs a space before a Latin one,
// and both sides of this platform register under both scripts.
function thaiSalutation(firstName) {
  if (!firstName) return '';
  return ` คุณ${/^[฀-๿]/.test(firstName) ? '' : ' '}${firstName}`;
}

// Formatted in UTC, always. The deadline is built as 23:59:59Z, so rendering
// it in the sender's local zone moved it to the next day on any machine east
// of Greenwich — the letter would then name a date the cutoff script disagrees
// with, which is the one thing this text must get right.
function formatDeadline(deadline, lang) {
  const d = deadline instanceof Date ? deadline : new Date(deadline);
  return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

const BUTTON = (href, label) => `
  <a href="${href}" style="display:inline-block;background:#006a62;color:#ffffff;text-decoration:none;
     font-weight:700;font-size:15px;padding:13px 26px;border-radius:8px;">${label}</a>`;

const SHELL = (inner) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px 28px;">
${inner}
      <p style="margin:28px 0 0;font-size:12px;color:#999;line-height:1.6;">
        ThaiHelper · <a href="https://thaihelper.app" style="color:#006a62;">thaihelper.app</a><br>
        Questions? Just reply to this email, or write to
        <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a>.
      </p>
    </div>
  </div>
</body></html>`;

// ─── Helper letter: an offer, with nothing at stake ──────────────────────────

function buildForHelper({ firstName }) {
  const name = firstName || 'there';
  const th = thaiSalutation(firstName);
  const url = 'https://thaihelper.app/profile';

  const subject = 'Add a verified phone badge to your profile / เพิ่มเครื่องหมายยืนยันเบอร์โทรในโปรไฟล์ของคุณ';

  const text = `Hi ${name},

You can now verify your phone number on ThaiHelper. When you do, families see a "Phone verified" badge on your profile.

Why it helps you: families are careful about who they contact, and a verified number tells them a real person answers. Profiles with the badge stand out.

It takes two minutes:
1. Open ${url}
2. Find "Phone verification"
3. Enter your number and the code we text you

This is completely optional. Nothing happens to your profile if you skip it — you stay listed exactly as you are.

To be clear about what we check: we confirm your email address and, if you do this, your phone number. We do not check ID documents.

— The ThaiHelper team

──────────

สวัสดีค่ะ${th}

ตอนนี้คุณสามารถยืนยันเบอร์โทรศัพท์ของคุณบน ThaiHelper ได้แล้ว เมื่อยืนยันแล้ว ครอบครัวจะเห็นเครื่องหมาย "ยืนยันเบอร์แล้ว" บนโปรไฟล์ของคุณ

ทำไมถึงดีกับคุณ: ครอบครัวระมัดระวังในการเลือกติดต่อ เบอร์ที่ยืนยันแล้วช่วยให้เขามั่นใจว่ามีคนจริงรับสาย โปรไฟล์ที่มีเครื่องหมายนี้จะโดดเด่นกว่า

ใช้เวลาสองนาที:
1. เปิด ${url}
2. หาหัวข้อ "Phone verification"
3. ใส่เบอร์ของคุณ แล้วกรอกรหัสที่เราส่งไปทาง SMS

เรื่องนี้ทำหรือไม่ทำก็ได้ ถ้าไม่ทำ โปรไฟล์ของคุณยังอยู่เหมือนเดิมทุกอย่าง

ขอชี้แจงว่าเราตรวจสอบอะไรบ้าง: เรายืนยันอีเมลของคุณ และถ้าคุณทำขั้นตอนนี้ ก็จะยืนยันเบอร์โทรด้วย เราไม่ได้ตรวจสอบบัตรประชาชนหรือเอกสารใดๆ

— ทีมงาน ThaiHelper
`;

  const html = SHELL(`
      <h1 style="margin:0 0 18px;font-size:20px;font-weight:700;color:#1B3A4B;">
        Add a verified phone badge to your profile
      </h1>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;">Hi ${esc(name)},</p>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;">
        You can now verify your phone number. When you do, families see a
        <strong>“Phone verified”</strong> badge on your profile.
      </p>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;">
        Families are careful about who they contact, and a verified number tells
        them a real person answers. Profiles with the badge stand out.
      </p>
      <p style="margin:22px 0;">${BUTTON(url, 'Verify my number')}</p>
      <p style="margin:0 0 14px;font-size:14px;color:#666;line-height:1.6;">
        This is completely optional — nothing happens to your profile if you skip it.
        We confirm your email and, if you do this, your phone number. We do not
        check ID documents.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:26px 0;">
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.75;">สวัสดีค่ะ${esc(th)}</p>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.75;">
        ตอนนี้คุณยืนยันเบอร์โทรศัพท์ได้แล้ว เมื่อยืนยันแล้ว ครอบครัวจะเห็นเครื่องหมาย
        <strong>“ยืนยันเบอร์แล้ว”</strong> บนโปรไฟล์ของคุณ
        โปรไฟล์ที่มีเครื่องหมายนี้จะโดดเด่นกว่า
      </p>
      <p style="margin:22px 0;">${BUTTON(url, 'ยืนยันเบอร์ของฉัน')}</p>
      <p style="margin:0;font-size:14px;color:#666;line-height:1.7;">
        ทำหรือไม่ทำก็ได้ ถ้าไม่ทำ โปรไฟล์ของคุณยังอยู่เหมือนเดิม
        เราตรวจสอบอีเมลและเบอร์โทรเท่านั้น ไม่ได้ตรวจสอบบัตรประชาชนหรือเอกสารใดๆ
      </p>`);

  return { subject, text, html };
}

// ─── Family letter: a deadline, and exactly what happens ─────────────────────

function buildForEmployer({ firstName, deadline }) {
  const name = firstName || 'there';
  const th = thaiSalutation(firstName);
  const url = 'https://thaihelper.app/employer-dashboard';
  const dEn = formatDeadline(deadline, 'en');
  const dTh = formatDeadline(deadline, 'th');

  const subject = `Action needed by ${dEn}: verify your phone number / ต้องดำเนินการภายใน ${dTh}: ยืนยันเบอร์โทรของคุณ`;

  const text = `Hi ${name},

We are asking every family on ThaiHelper to verify a phone number, and we need you to do it by ${dEn}.

Why: a small number of fake family accounts have been using the platform to approach helpers and move them off to LINE. Email alone does not stop it — a new email address costs nothing. A phone number does, and that is enough to make this stop being worth their time.

What happens if you do not verify by ${dEn}: your profile is hidden. You will not be able to browse helpers, start conversations, or reply to conversations you already have.

Your account is NOT deleted. Nothing is lost — your profile, your job description and all your conversations stay exactly as they are. Verify your number at any time, even months later, and everything comes straight back.

It takes two minutes:
1. Open ${url}
2. Find "Phone verification"
3. Enter your number and the code we text you

Your number is never shown to helpers or published anywhere. It is only used to confirm you are a real person and, if you want, to notify you about new messages.

To be clear about what we check: we confirm your email address and your phone number. We do not check ID documents.

Sorry for the extra step. It is the one thing that actually protects the helpers on this platform.

— The ThaiHelper team

──────────

สวัสดีค่ะ${th}

เราขอให้ทุกครอบครัวบน ThaiHelper ยืนยันเบอร์โทรศัพท์ ภายในวันที่ ${dTh}

เหตุผล: มีบัญชีครอบครัวปลอมจำนวนหนึ่งใช้แพลตฟอร์มเพื่อติดต่อผู้ช่วยแล้วชวนไปคุยต่อทาง LINE การยืนยันอีเมลอย่างเดียวหยุดเรื่องนี้ไม่ได้ เพราะสมัครอีเมลใหม่ไม่มีค่าใช้จ่าย แต่เบอร์โทรศัพท์มีต้นทุน

ถ้าไม่ยืนยันภายในวันที่ ${dTh}: โปรไฟล์ของคุณจะถูกซ่อน คุณจะไม่สามารถดูโปรไฟล์ผู้ช่วย เริ่มการสนทนาใหม่ หรือตอบข้อความในการสนทนาที่มีอยู่แล้วได้

บัญชีของคุณจะไม่ถูกลบ ไม่มีอะไรหายไป ทั้งโปรไฟล์ รายละเอียดงาน และการสนทนาทั้งหมดยังอยู่ครบ เมื่อคุณยืนยันเบอร์เมื่อไหร่ก็ตาม ทุกอย่างจะกลับมาทันที

ใช้เวลาสองนาที:
1. เปิด ${url}
2. หาหัวข้อ "Phone verification"
3. ใส่เบอร์ของคุณ แล้วกรอกรหัสที่เราส่งไปทาง SMS

เบอร์ของคุณจะไม่ถูกแสดงให้ผู้ช่วยเห็นหรือเผยแพร่ที่ใด ใช้เพื่อยืนยันว่าคุณเป็นคนจริงเท่านั้น

เราตรวจสอบอีเมลและเบอร์โทรเท่านั้น ไม่ได้ตรวจสอบบัตรประชาชนหรือเอกสารใดๆ

ขออภัยในความไม่สะดวก แต่นี่คือสิ่งที่ช่วยปกป้องผู้ช่วยบนแพลตฟอร์มนี้ได้จริง

— ทีมงาน ThaiHelper
`;

  const html = SHELL(`
      <h1 style="margin:0 0 18px;font-size:20px;font-weight:700;color:#1B3A4B;">
        Please verify your phone number by ${esc(dEn)}
      </h1>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;">Hi ${esc(name)},</p>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;">
        We are asking every family on ThaiHelper to verify a phone number.
        A small number of fake family accounts have been approaching helpers and
        moving them off to LINE. Email alone does not stop it — a new email
        address costs nothing. A phone number does.
      </p>
      <div style="margin:20px 0;padding:16px;background:#fff8ef;border-left:4px solid #F4A261;border-radius:6px;">
        <p style="margin:0 0 8px;font-size:14px;color:#1a1a1a;line-height:1.65;">
          <strong>If you have not verified by ${esc(dEn)}</strong>, your profile is
          hidden: no browsing helpers, no new conversations, and no replying to
          conversations you already have.
        </p>
        <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.65;">
          <strong>Your account is not deleted.</strong> Your profile, your job
          description and every conversation stay exactly as they are. Verify at
          any time — even months later — and everything comes straight back.
        </p>
      </div>
      <p style="margin:22px 0;">${BUTTON(url, 'Verify my number')}</p>
      <p style="margin:0 0 14px;font-size:14px;color:#666;line-height:1.6;">
        Your number is never shown to helpers or published anywhere. We confirm
        your email address and your phone number; we do not check ID documents.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:26px 0;">
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.75;">สวัสดีค่ะ${esc(th)}</p>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.75;">
        เราขอให้ทุกครอบครัวยืนยันเบอร์โทรศัพท์ ภายในวันที่ <strong>${esc(dTh)}</strong>
        เพราะมีบัญชีครอบครัวปลอมใช้แพลตฟอร์มติดต่อผู้ช่วยแล้วชวนไปคุยต่อทาง LINE
      </p>
      <div style="margin:20px 0;padding:16px;background:#fff8ef;border-left:4px solid #F4A261;border-radius:6px;">
        <p style="margin:0 0 8px;font-size:14px;color:#1a1a1a;line-height:1.75;">
          <strong>ถ้าไม่ยืนยันภายในวันที่ ${esc(dTh)}</strong> โปรไฟล์ของคุณจะถูกซ่อน
          ดูโปรไฟล์ผู้ช่วยไม่ได้ เริ่มสนทนาใหม่ไม่ได้ และตอบข้อความเดิมไม่ได้
        </p>
        <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.75;">
          <strong>บัญชีของคุณจะไม่ถูกลบ</strong> ทุกอย่างยังอยู่ครบ
          เมื่อยืนยันเมื่อไหร่ก็ตาม ทุกอย่างจะกลับมาทันที
        </p>
      </div>
      <p style="margin:22px 0;">${BUTTON(url, 'ยืนยันเบอร์ของฉัน')}</p>
      <p style="margin:0;font-size:14px;color:#666;line-height:1.7;">
        เบอร์ของคุณจะไม่ถูกแสดงให้ผู้ช่วยเห็น
        เราตรวจสอบอีเมลและเบอร์โทรเท่านั้น ไม่ได้ตรวจสอบบัตรประชาชน
      </p>`);

  return { subject, text, html };
}

/**
 * @param {'helper'|'employer'} role
 * @param {string} firstName
 * @param {Date|string} [deadline]  required for employers; ignored for helpers
 */
export function buildPhoneVerificationRequest({ role, firstName, deadline }) {
  if (role === 'employer') {
    if (!deadline) throw new Error('employer letter needs a deadline');
    return buildForEmployer({ firstName, deadline });
  }
  return buildForHelper({ firstName });
}

export async function sendPhoneVerificationRequest({ role, firstName, email, deadline }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildPhoneVerificationRequest({ role, firstName, deadline });
  // Always send the text part too — mails without one land in spam far more
  // often, and most of these recipients are on Gmail.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
