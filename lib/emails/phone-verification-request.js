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
 * Families get a date, but not a deadline. From it, STARTING A NEW
 * CONVERSATION needs a verified number. Replying in a conversation they
 * already have does not, nothing is hidden and nothing is deleted.
 *
 * That replaced a harsher draft — hide the profile after a cutoff, no browsing,
 * no replying — and the numbers are why. 91 of the 159 families here before the
 * cutover started a new conversation in a fortnight, 84 of them unverified. The
 * old rule would have caught all 159 including the dormant ones and cut live
 * conversations dead; this one touches exactly the people doing the thing the
 * rule is about, at the moment they do it.
 *
 * Tone for the family letter: they have done nothing wrong and most of them
 * are real families who will be annoyed. So — what changes, what explicitly
 * does NOT change (their open conversations; this is the line that matters to
 * someone with thirty of them), why, and how to be done with it in two minutes.
 * No implication that they are under suspicion.
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

// ─── Family letter: one new rule, and what it does not touch ────────────────

function buildForEmployer({ firstName, effectiveFrom }) {
  const name = firstName || 'there';
  const th = thaiSalutation(firstName);
  const url = 'https://thaihelper.app/employer-dashboard';
  const dEn = formatDeadline(effectiveFrom, 'en');
  const dTh = formatDeadline(effectiveFrom, 'th');

  const subject = `From ${dEn}: verify your phone to message someone new / ตั้งแต่ ${dTh}: ยืนยันเบอร์โทรก่อนทักหาคนใหม่`;

  const text = `Hi ${name},

From ${dEn}, contacting a helper for the first time will need a verified phone number.

What does NOT change — and this is the part worth reading:

  Your conversations stay open. You can keep replying to everyone you are already
  talking to, exactly as now. Nothing is hidden and nothing is deleted.

The only thing that needs a verified number is starting a NEW conversation with
someone you have not spoken to yet.

Why: a handful of fake family accounts have been using ThaiHelper to approach
helpers and pull them off to LINE. Email does not stop it — a new email address
costs nothing. A phone number does, and since each number can only be used on one
account, it stops being worth their time.

It takes two minutes, and you can do it now:
1. Open ${url}
2. Find "Phone verification"
3. Enter your number and the code we text you

Your number is never shown to helpers and never published. It confirms you are a
real person, and it can notify you about new messages if you want.

To be clear about what we check: your email address and your phone number. We do
not check ID documents.

Thank you for putting up with the extra step. It is the one thing that genuinely
protects the helpers on this platform — and once you have done it, families with a
verified number carry a badge that helpers can see.

— The ThaiHelper team

──────────

สวัสดีค่ะ${th}

ตั้งแต่วันที่ ${dTh} เป็นต้นไป การทักหาผู้ช่วยคนใหม่เป็นครั้งแรกจะต้องยืนยันเบอร์โทรศัพท์ก่อน

สิ่งที่ไม่เปลี่ยน และนี่คือส่วนสำคัญ:

  การสนทนาที่มีอยู่แล้วยังเปิดอยู่ตามปกติ คุณยังตอบทุกคนที่กำลังคุยอยู่ได้เหมือนเดิม
  ไม่มีการซ่อนโปรไฟล์ และไม่มีการลบบัญชี

สิ่งที่ต้องยืนยันเบอร์ คือการเริ่มสนทนาใหม่กับคนที่คุณยังไม่เคยคุยด้วยเท่านั้น

เหตุผล: มีบัญชีครอบครัวปลอมจำนวนหนึ่งใช้ ThaiHelper ทักหาผู้ช่วยแล้วชวนไปคุยต่อทาง LINE
การยืนยันอีเมลอย่างเดียวหยุดเรื่องนี้ไม่ได้ เพราะสมัครอีเมลใหม่ไม่มีค่าใช้จ่าย แต่เบอร์โทรมีต้นทุน
และหนึ่งเบอร์ใช้ได้เพียงบัญชีเดียว

ใช้เวลาสองนาที ทำตอนนี้ได้เลย:
1. เปิด ${url}
2. หาหัวข้อ "Phone verification"
3. ใส่เบอร์ของคุณ แล้วกรอกรหัสที่เราส่งไปทาง SMS

เบอร์ของคุณจะไม่ถูกแสดงให้ผู้ช่วยเห็นและไม่ถูกเผยแพร่ที่ใด ใช้เพื่อยืนยันว่าคุณเป็นคนจริงเท่านั้น

เราตรวจสอบอีเมลและเบอร์โทรเท่านั้น ไม่ได้ตรวจสอบบัตรประชาชนหรือเอกสารใดๆ

ขอบคุณที่เข้าใจ นี่คือสิ่งที่ช่วยปกป้องผู้ช่วยบนแพลตฟอร์มนี้ได้จริง
และเมื่อยืนยันแล้ว โปรไฟล์ของคุณจะมีเครื่องหมายที่ผู้ช่วยมองเห็น

— ทีมงาน ThaiHelper
`;

  const html = SHELL(`
      <h1 style="margin:0 0 18px;font-size:20px;font-weight:700;color:#1B3A4B;">
        From ${esc(dEn)}: a verified phone to message someone new
      </h1>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;">Hi ${esc(name)},</p>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;">
        From <strong>${esc(dEn)}</strong>, contacting a helper for the first time
        will need a verified phone number.
      </p>
      <div style="margin:20px 0;padding:16px;background:#eef7f5;border-left:4px solid #006a62;border-radius:6px;">
        <p style="margin:0 0 8px;font-size:14px;color:#1a1a1a;line-height:1.65;">
          <strong>Your conversations stay open.</strong> You can keep replying to
          everyone you are already talking to, exactly as now.
        </p>
        <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.65;">
          Nothing is hidden and nothing is deleted. The only thing that needs a
          verified number is starting a <strong>new</strong> conversation.
        </p>
      </div>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;">
        Why: a handful of fake family accounts have been approaching helpers and
        pulling them off to LINE. Email does not stop it — a new address costs
        nothing. A phone number does, and each number works on one account only.
      </p>
      <p style="margin:22px 0;">${BUTTON(url, 'Verify my number')}</p>
      <p style="margin:0 0 14px;font-size:14px;color:#666;line-height:1.6;">
        Takes two minutes. Your number is never shown to helpers or published
        anywhere. We check your email address and your phone number; we do not
        check ID documents. Once verified, your profile carries a badge helpers
        can see.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:26px 0;">
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.75;">สวัสดีค่ะ${esc(th)}</p>
      <p style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.75;">
        ตั้งแต่วันที่ <strong>${esc(dTh)}</strong> การทักหาผู้ช่วยคนใหม่เป็นครั้งแรก
        จะต้องยืนยันเบอร์โทรศัพท์ก่อน
      </p>
      <div style="margin:20px 0;padding:16px;background:#eef7f5;border-left:4px solid #006a62;border-radius:6px;">
        <p style="margin:0 0 8px;font-size:14px;color:#1a1a1a;line-height:1.75;">
          <strong>การสนทนาที่มีอยู่แล้วยังเปิดอยู่</strong> คุณยังตอบทุกคนที่กำลังคุยอยู่ได้เหมือนเดิม
        </p>
        <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.75;">
          ไม่มีการซ่อนโปรไฟล์ ไม่มีการลบบัญชี ต้องยืนยันเฉพาะตอนเริ่มสนทนา<strong>ใหม่</strong>เท่านั้น
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
 * @param {Date|string} [effectiveFrom]  the day the rule starts, for families.
 *   Named for what it is: the date a NEW conversation begins to need a verified
 *   number. It is not a deadline and nothing expires on it — an earlier draft
 *   of this letter announced a cutoff after which profiles were hidden, and
 *   that policy was dropped in favour of this one. Ignored for helpers.
 */
export function buildPhoneVerificationRequest({ role, firstName, effectiveFrom }) {
  if (role === 'employer') {
    if (!effectiveFrom) throw new Error('family letter needs the date the rule starts');
    return buildForEmployer({ firstName, effectiveFrom });
  }
  return buildForHelper({ firstName });
}

export async function sendPhoneVerificationRequest({ role, firstName, email, effectiveFrom }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildPhoneVerificationRequest({ role, firstName, effectiveFrom });
  // Always send the text part too — mails without one land in spam far more
  // often, and most of these recipients are on Gmail.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
