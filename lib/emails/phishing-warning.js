/**
 * Phishing warning to the ten helpers messaged by EMP-6J3VUE — 27 September 2026.
 *
 * An account registered as "Support ThaiHelper" (vincenzotoro26@gmail.com,
 * phone +63) passed email and SMS verification, then sent the same message to
 * ten helpers in seven minutes, in English and Thai: "Account verification
 * required — we have temporarily suspended your account", with a tinu.be
 * shortlink. Seven of the ten opened it in their inbox. One replied asking for
 * a LINE or WhatsApp number, which is how far it got before the account was
 * suspended on 2026-09-28.
 *
 * This is a different attack from the September LINE scam (see scam-warning.js).
 * That one asked for money. This one impersonates US, and the thing at risk is
 * the helper's own account: our login is an email address plus a reference
 * number, so a convincing fake page asking to "confirm your account" collects
 * exactly the two things needed to sign in as her.
 *
 * So the message has one job above all others: say plainly that the suspension
 * notice was false and her account was never suspended. Several of these women
 * have spent a day believing they were locked out of the place they look for
 * work. Relief first, then the rule, then what to do if she typed anything in.
 *
 * Tone follows scam-warning.js: no blame, no alarm, nothing that implies she
 * was careless for opening it. The message was designed to be believed.
 *
 * Bilingual EN + TH — most of these helpers read Thai first.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

export function buildPhishingWarning({ firstName }) {
  const name = firstName || 'there';
  // Thai runs คุณ straight into a Thai name but needs a space before a Latin
  // one — same handling as scam-warning.js.
  const thaiName = firstName
    ? ` คุณ${/^[฀-๿]/.test(firstName) ? '' : ' '}${firstName}`
    : '';

  const subject = 'Your account is fine — that "suspended" message was fake / บัญชีของคุณปกติดี — ข้อความ "ถูกระงับ" นั้นเป็นของปลอม';

  const text = `Hi ${name},

Yesterday an account calling itself "Support ThaiHelper" told you your account was suspended, and asked you to confirm it through a link.

That message was fake. Your account was never suspended. You do not need to do anything.

It did not come from us. Someone registered an ordinary account and named it to look official. It is now blocked.

We will never message you to say your account is suspended, and never ask you to confirm your account through a link in a chat. If that ever arrives again, it is not from us.

If you opened the link and typed anything in, please write to me. Your email and reference number are enough for someone to sign in as you, and I will secure your account. If the password you entered is one you use anywhere else, change it there today.

If you ignored the message, there is nothing to do.

I am sorry it reached you. It was built to be believed.

Jelena
Founder, thaihelper.app
${SUPPORT}

─────────────────────────

สวัสดีค่ะ${thaiName}

เมื่อวานนี้ มีบัญชีชื่อ "Support ThaiHelper" ส่งข้อความบอกว่าบัญชีของคุณถูกระงับ และให้กดลิงก์เพื่อยืนยัน

ข้อความนั้นเป็นของปลอม บัญชีของคุณไม่เคยถูกระงับ คุณไม่ต้องทำอะไรเลย

ข้อความนั้นไม่ได้มาจากเรา มีคนสมัครบัญชีธรรมดา แล้วตั้งชื่อให้ดูเหมือนเป็นทางการ ตอนนี้บัญชีนั้นถูกระงับแล้ว

เราจะไม่มีวันส่งข้อความบอกว่าบัญชีของคุณถูกระงับ และจะไม่ขอให้คุณยืนยันบัญชีผ่านลิงก์ในแชท ถ้าได้รับอีก แปลว่าไม่ได้มาจากเรา

ถ้าคุณกดลิงก์และกรอกข้อมูลลงไป กรุณาเขียนมาหาฉันค่ะ อีเมลและหมายเลขอ้างอิงเพียงเท่านี้ก็พอให้คนอื่นเข้าสู่ระบบเป็นคุณได้ ฉันจะดูแลความปลอดภัยบัญชีให้ และถ้ารหัสผ่านที่กรอกไปเป็นรหัสเดียวกับที่ใช้ที่อื่น กรุณาเปลี่ยนที่นั่นวันนี้เลยค่ะ

ถ้าคุณไม่ได้ทำอะไร ก็ไม่ต้องทำอะไรเพิ่มค่ะ

ขอโทษที่เรื่องนี้ไปถึงคุณ ข้อความนี้ถูกทำมาให้ดูน่าเชื่อถือ

เจเลน่า
ผู้ก่อตั้ง thaihelper.app
${SUPPORT}`;

  const p = 'style="margin:0 0 14px;"';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;line-height:1.65;color:#222;">
<div style="max-width:540px;margin:32px auto;padding:0 18px;">
  <div style="background:#fff;border-radius:14px;padding:28px;border-top:4px solid #006a62;">

    <p ${p}>Hi ${esc(name)},</p>
    <p ${p}>Yesterday an account calling itself &quot;Support ThaiHelper&quot; told you your account was suspended, and asked you to confirm it through a link.</p>

    <div style="background:#e6f5f3;border-left:3px solid #006a62;padding:14px 18px;border-radius:8px;margin:0 0 16px;">
      <strong>That message was fake. Your account was never suspended.</strong><br>You do not need to do anything.
    </div>

    <p ${p}>It did not come from us. Someone registered an ordinary account and named it to look official. It is now blocked.</p>
    <p ${p}><strong>We will never message you to say your account is suspended</strong>, and never ask you to confirm your account through a link in a chat. If that ever arrives again, it is not from us.</p>
    <p ${p}>If you opened the link and typed anything in, please write to me. Your email and reference number are enough for someone to sign in as you, and I will secure your account. If the password you entered is one you use anywhere else, change it there today.</p>
    <p ${p}>If you ignored the message, there is nothing to do.</p>
    <p ${p}>I am sorry it reached you. It was built to be believed.</p>
    <p style="margin:0;">Jelena<br><span style="color:#666;font-size:14px;">Founder, thaihelper.app · <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a></span></p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:26px 0;">

    <p ${p}>สวัสดีค่ะ${esc(thaiName)}</p>
    <p ${p}>เมื่อวานนี้ มีบัญชีชื่อ &quot;Support ThaiHelper&quot; ส่งข้อความบอกว่าบัญชีของคุณถูกระงับ และให้กดลิงก์เพื่อยืนยัน</p>

    <div style="background:#e6f5f3;border-left:3px solid #006a62;padding:14px 18px;border-radius:8px;margin:0 0 16px;">
      <strong>ข้อความนั้นเป็นของปลอม บัญชีของคุณไม่เคยถูกระงับ</strong><br>คุณไม่ต้องทำอะไรเลย
    </div>

    <p ${p}>ข้อความนั้นไม่ได้มาจากเรา มีคนสมัครบัญชีธรรมดา แล้วตั้งชื่อให้ดูเหมือนเป็นทางการ ตอนนี้บัญชีนั้นถูกระงับแล้ว</p>
    <p ${p}><strong>เราจะไม่มีวันส่งข้อความบอกว่าบัญชีของคุณถูกระงับ</strong> และจะไม่ขอให้คุณยืนยันบัญชีผ่านลิงก์ในแชท ถ้าได้รับอีก แปลว่าไม่ได้มาจากเรา</p>
    <p ${p}>ถ้าคุณกดลิงก์และกรอกข้อมูลลงไป กรุณาเขียนมาหาฉันค่ะ อีเมลและหมายเลขอ้างอิงเพียงเท่านี้ก็พอให้คนอื่นเข้าสู่ระบบเป็นคุณได้ ฉันจะดูแลความปลอดภัยบัญชีให้ และถ้ารหัสผ่านที่กรอกไปเป็นรหัสเดียวกับที่ใช้ที่อื่น กรุณาเปลี่ยนที่นั่นวันนี้เลยค่ะ</p>
    <p ${p}>ถ้าคุณไม่ได้ทำอะไร ก็ไม่ต้องทำอะไรเพิ่มค่ะ</p>
    <p ${p}>ขอโทษที่เรื่องนี้ไปถึงคุณ ข้อความนี้ถูกทำมาให้ดูน่าเชื่อถือ</p>
    <p style="margin:0;">เจเลน่า<br><span style="color:#666;font-size:14px;">ผู้ก่อตั้ง thaihelper.app · <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a></span></p>

  </div>
</div>
</body></html>`;

  return { subject, text, html };
}

export async function sendPhishingWarning({ firstName, email }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildPhishingWarning({ firstName });
  // Always include the text part — see the SPF/DKIM/DMARC notes; mails without
  // one land in spam far more often, and most of these recipients are on Gmail.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
