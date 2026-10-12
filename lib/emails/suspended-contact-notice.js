/**
 * Notice to the helpers an account messaged before we suspended it — October 2026.
 *
 * Written on 2026-10-12 when three family accounts were suspended in one
 * sitting, each for a different reason, each with a different set of helpers
 * who had already read its messages:
 *
 *   EMP-ESWAAB  recruiting for Sydney, Australia ("woman only")        2 helpers
 *   EMP-E8QRSK  "personal assistant" at 60,000 THB, room in his condo  20 helpers
 *   EMP-GGTY8U  asked housekeepers and nannies for massage             45 helpers
 *
 * The scam warning of September (lib/emails/scam-warning.js) was written for
 * one case and hard-codes it. The suspension itself is generic by now
 * (scripts/suspend-account.js); the letter that follows it should be too. So
 * this template has a fixed frame — what blocked means for you, the rules
 * that protect you, how to reach us — and a per-case paragraph that says what
 * the account actually did, in plain words, without speculating about why.
 *
 * It NAMES the account the way the helper saw it in her chat ("Paul"), unlike
 * lib/emails/safety-before-meeting.js, which deliberately named nobody. The
 * difference is evidence: that letter went out about an account nothing could
 * be proven against; this one goes out after a suspension with the reason
 * written into the record. A helper who got five "Hi, are you still looking
 * for work" messages that week cannot act on a warning that does not say
 * which one.
 *
 * Thai first for Thai nationals, English first for everyone else — keyed on
 * nationality, not preferred_language (see project memory: speaking Thai is
 * not reading Thai). Most of EMP-GGTY8U's contacts are from Myanmar and the
 * Philippines; they get English first.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

// Thai runs คุณ straight into a Thai name but needs a space before a Latin one.
function thaiSalutation(firstName) {
  if (!firstName) return '';
  return ` คุณ${/^[฀-๿]/.test(firstName) ? '' : ' '}${firstName}`;
}

/**
 * One entry per suspension. `label` is the name the helper saw in the chat.
 * `phoneBlocked` adds the sentence about the number being blocked
 * platform-wide — only true when suspend-account.js actually blocked one.
 */
export const CASES = {
  'EMP-ESWAAB': {
    label: 'Naren',
    phoneBlocked: false,
    whatEn:
      'The account offered work in Sydney, Australia, and asked to move the conversation to WhatsApp. '
      + 'ThaiHelper is only for household jobs in Thailand. A job abroad offered through a family account '
      + 'here is not real: there is no visa a family can arrange for you this way, and offers like this '
      + 'usually end with a request to pay for a "visa", a "ticket" or an "agency fee".',
    whatTh:
      'บัญชีนี้เสนองานที่ซิดนีย์ ประเทศออสเตรเลีย และขอให้ย้ายไปคุยกันทาง WhatsApp '
      + 'ThaiHelper มีไว้สำหรับงานในบ้านในประเทศไทยเท่านั้น งานต่างประเทศที่เสนอผ่านบัญชีครอบครัวที่นี่ไม่ใช่ของจริง '
      + 'ไม่มีวีซ่าที่ครอบครัวจะจัดให้คุณได้ด้วยวิธีนี้ และข้อเสนอแบบนี้มักจบลงด้วยการขอให้คุณจ่ายค่า "วีซ่า" "ตั๋วเครื่องบิน" หรือ "ค่านายหน้า"',
  },
  'EMP-E8QRSK': {
    label: 'Mark B.',
    phoneBlocked: false,
    whatEn:
      'The account\'s profile said it was looking for a driver two days a week. The message you received '
      + 'offered something else: a "personal assistant" at 60,000 baht a month, with a room in the sender\'s '
      + 'condo. That is not the job that was posted, the pay is far above what any driving job in Thailand '
      + 'pays, and the offer went only to women. We do not know what the sender intended — but please do '
      + 'not meet this person, and do not send documents or photos.',
    whatTh:
      'โปรไฟล์ของบัญชีนี้ระบุว่าหาคนขับรถสัปดาห์ละ 2 วัน แต่ข้อความที่คุณได้รับเสนออย่างอื่น: '
      + '"ผู้ช่วยส่วนตัว" เดือนละ 60,000 บาท พร้อมห้องพักในคอนโดของผู้ส่ง นั่นไม่ใช่งานที่ประกาศไว้ '
      + 'ค่าจ้างสูงกว่างานขับรถใดๆ ในประเทศไทยมาก และข้อเสนอนี้ส่งถึงผู้หญิงเท่านั้น '
      + 'เราไม่ทราบว่าผู้ส่งตั้งใจอะไร แต่กรุณาอย่าไปพบคนนี้ และอย่าส่งเอกสารหรือรูปถ่ายใดๆ',
  },
  'EMP-GGTY8U': {
    label: 'Paul',
    phoneBlocked: true,
    whatEn:
      'The account\'s profile said it was looking for a housekeeper and, later, a caregiver for the sender\'s '
      + 'mother. In the chats, the sender asked several helpers for massage instead — hips, knees, feet, '
      + '"deep pressure and stretching, then oil", several evenings a week at his condo. That is not household '
      + 'work, it is not what you signed up for, and asking it of a housekeeper or nanny is against our rules. '
      + 'If you were asked, you did nothing wrong by answering. If you have already met him or arranged to, '
      + 'you can stop — you owe him nothing.',
    whatTh:
      'โปรไฟล์ของบัญชีนี้ระบุว่าหาแม่บ้าน และต่อมาหาผู้ดูแลคุณแม่ของผู้ส่ง แต่ในแชท ผู้ส่งกลับขอให้ผู้ช่วยหลายคนนวดแทน — '
      + 'สะโพก เข่า เท้า "กดลึก ยืดเส้น แล้วใช้น้ำมัน" หลายคืนต่อสัปดาห์ที่คอนโดของเขา นั่นไม่ใช่งานบ้าน ไม่ใช่สิ่งที่คุณสมัครมาทำ '
      + 'และการขอแบบนี้จากแม่บ้านหรือพี่เลี้ยงผิดกฎของเรา ถ้าคุณถูกขอ คุณไม่ได้ทำอะไรผิดที่ตอบไป '
      + 'ถ้าคุณได้พบเขาแล้วหรือนัดไว้ คุณหยุดได้เลย — คุณไม่ติดค้างอะไรเขา',
  },
};

const rulesEn = (phoneBlocked) => [
  ['The chat is closed on ThaiHelper.',
   'The account cannot write to you again'
   + (phoneBlocked ? ', and the phone number it was using is now blocked across the whole platform — from any account.' : '.')],
  ['If the conversation moved to WhatsApp or LINE, you can simply stop replying.',
   'You do not need to explain. Blocking the number is fine.'],
  ['Never pay anything to get a job, and never send a photo of your ID card or passport.',
   'Not for a visa, a ticket, a uniform or a "verification". No real family needs that through ThaiHelper.'],
  ['You may always ask exactly what a job involves — and say no.',
   'If someone gets angry at the question, or the job turns out to be something other than what was posted, that is your answer.'],
];

const rulesTh = (phoneBlocked) => [
  ['การสนทนานี้ถูกปิดแล้วใน ThaiHelper',
   'บัญชีนี้ไม่สามารถเขียนถึงคุณได้อีก'
   + (phoneBlocked ? ' และหมายเลขโทรศัพท์ที่เขาใช้ถูกบล็อกทั้งแพลตฟอร์มแล้ว ไม่ว่าจะจากบัญชีไหนก็ตาม' : '')],
  ['ถ้าการสนทนาย้ายไป WhatsApp หรือ LINE แล้ว คุณหยุดตอบได้เลย',
   'ไม่จำเป็นต้องอธิบาย บล็อกเบอร์ได้เลยค่ะ'],
  ['ไม่ต้องจ่ายเงินใดๆ เพื่อให้ได้งาน และไม่ต้องส่งรูปบัตรประชาชนหรือพาสปอร์ต',
   'ไม่ว่าจะเป็นค่าวีซ่า ค่าตั๋ว ค่าชุดทำงาน หรือ "ค่ายืนยันตัวตน" ไม่มีครอบครัวจริงที่ต้องการสิ่งนี้ผ่าน ThaiHelper'],
  ['คุณมีสิทธิ์ถามเสมอว่างานนี้ทำอะไรบ้าง — และปฏิเสธได้',
   'ถ้ามีใครโกรธที่คุณถาม หรืองานกลายเป็นอย่างอื่นที่ไม่ตรงกับที่ประกาศไว้ นั่นคือคำตอบของคุณแล้ว'],
];

const textBlock = (intro, what, lead, rules, closing) =>
  `${intro}\n\n${what}\n\n${lead}\n\n`
  + rules.map(([head, body], i) => `${i + 1}. ${head}${body ? `\n   ${body}` : ''}`).join('\n\n')
  + `\n\n${closing}`;

const htmlRules = (rules) => rules.map(([head, body], i) => `
      <tr>
        <td style="padding:0 12px 16px 0;vertical-align:top;font-size:17px;font-weight:700;color:#006a62;">${i + 1}</td>
        <td style="padding:0 0 16px;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a1a;line-height:1.5;">${esc(head)}</p>
          ${body ? `<p style="margin:0;font-size:14px;color:#555;line-height:1.65;">${esc(body)}</p>` : ''}
        </td>
      </tr>`).join('');

export function buildSuspendedContactNotice({ firstName, thaiFirst, caseKey }) {
  const c = CASES[caseKey];
  if (!c) throw new Error(`No case text for ${caseKey} — add it to CASES first.`);
  const name = firstName || 'there';
  const th = thaiSalutation(firstName);

  const introEn = `Hi ${name},\n\nA family account that messaged you on ThaiHelper — shown in your chat as "${c.label}" — has been blocked. I am writing so you know why, and what it means for you.`;
  const introTh = `สวัสดีค่ะ${th}\n\nบัญชีครอบครัวที่เคยส่งข้อความถึงคุณใน ThaiHelper — ชื่อที่แสดงในแชทของคุณคือ "${c.label}" — ถูกระงับแล้ว เราเขียนมาเพื่อให้คุณทราบเหตุผล และสิ่งที่หมายถึงสำหรับคุณค่ะ`;
  const leadEn = 'What this means for you:';
  const leadTh = 'สิ่งที่หมายถึงสำหรับคุณ:';
  const closeEn = `If you already met this person, paid anything, or something happened that did not feel right, please reply to this email or write to ${SUPPORT}. We read everything, and nothing you tell us will be held against you.\n\n— Jelena, ThaiHelper`;
  const closeTh = `ถ้าคุณได้พบคนนี้แล้ว จ่ายเงินไปแล้ว หรือมีอะไรเกิดขึ้นที่รู้สึกไม่ถูกต้อง กรุณาตอบกลับอีเมลนี้หรือเขียนมาที่ ${SUPPORT} เราอ่านทุกฉบับ และสิ่งที่คุณบอกเราจะไม่ถูกนำมาใช้ต่อว่าคุณค่ะ\n\n— Jelena, ThaiHelper`;

  const en = textBlock(introEn, c.whatEn, leadEn, rulesEn(c.phoneBlocked), closeEn);
  const tha = textBlock(introTh, c.whatTh, leadTh, rulesTh(c.phoneBlocked), closeTh);

  const subject = thaiFirst
    ? 'สำคัญ: บัญชีครอบครัวที่คุณเคยคุยด้วยถูกระงับแล้ว / Important: a family account you spoke with has been blocked'
    : 'Important: a family account you spoke with has been blocked / สำคัญ: บัญชีครอบครัวที่คุณเคยคุยด้วยถูกระงับแล้ว';

  const text = thaiFirst
    ? `${tha}\n\n──────────\n\n${en}\n`
    : `${en}\n\n──────────\n\n${tha}\n`;

  const section = (intro, what, lead, rules, closing) => `
      <p style="margin:0 0 18px;font-size:15px;color:#333;line-height:1.7;white-space:pre-line;">${esc(intro)}</p>
      <p style="margin:0 0 18px;padding:14px 16px;background:#fff6ec;border-left:4px solid #F4A261;font-size:15px;color:#333;line-height:1.7;">${esc(what)}</p>
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1a1a1a;">${esc(lead)}</p>
      <table style="width:100%;border-collapse:collapse;">${htmlRules(rules)}</table>
      <p style="margin:18px 0 0;font-size:14px;color:#555;line-height:1.7;white-space:pre-line;">${esc(closing)}</p>`;

  const secEn = section(introEn, c.whatEn, leadEn, rulesEn(c.phoneBlocked), closeEn);
  const secTh = section(introTh, c.whatTh, leadTh, rulesTh(c.phoneBlocked), closeTh);
  const first = thaiFirst ? secTh : secEn;
  const second = thaiFirst ? secEn : secTh;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px 28px;">
${first}
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">
${second}
      <p style="margin:28px 0 0;font-size:12px;color:#999;line-height:1.6;">
        ThaiHelper · <a href="https://thaihelper.app" style="color:#006a62;">thaihelper.app</a>
      </p>
    </div>
  </div>
</body></html>`;

  return { subject, text, html };
}

export async function sendSuspendedContactNotice({ firstName, email, thaiFirst, caseKey }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildSuspendedContactNotice({ firstName, thaiFirst, caseKey });
  // Always include the text part — mails without one land in spam far more often.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
