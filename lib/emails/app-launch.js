// One-off launch announcement for the iOS and Android apps.
//
// Helpers read Thai first: most of them do, and the Thai block carries the
// reason to install (a family's message reaches their phone immediately,
// and the first helper to answer usually gets the job). Families read
// English first. Both mails name the reader's reference number, because
// signing in needs it and "I can't find my number" is the single most
// common reason someone stops at the login screen.

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';

const IOS_URL = 'https://apps.apple.com/app/thaihelper-app/id6801794164';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=app.thaihelper.mobile';

const TEAL = '#006a62';
const GOLD = '#F4A261';

function shell(inner, accent, unsubscribeUrl, unsubscribeLabel) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:22px;font-weight:800;color:#1B3A4B;">Thai<span style="color:${accent}">Helper</span></span>
    </div>
    <div style="background:#ffffff;border-radius:14px;padding:32px 28px;color:#1B3A4B;font-size:15px;line-height:1.65;">
      ${inner}
    </div>
    <p style="text-align:center;color:#8a9a95;font-size:12px;line-height:1.6;margin-top:24px;">
      ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color:#8a9a95;">${unsubscribeLabel}</a>` : ''}
    </p>
  </div>
</body></html>`;
}

function buttons(accent) {
  return `<div style="text-align:center;margin:26px 0;">
    <a href="${IOS_URL}" style="display:inline-block;margin:4px;padding:13px 22px;background:${accent};color:#ffffff;text-decoration:none;border-radius:9px;font-weight:700;">iPhone</a>
    <a href="${PLAY_URL}" style="display:inline-block;margin:4px;padding:13px 22px;background:#1B3A4B;color:#ffffff;text-decoration:none;border-radius:9px;font-weight:700;">Android</a>
  </div>`;
}

export async function sendHelperAppLaunch({ firstName, email, ref, unsubscribeUrl }) {
  const name = firstName || '';
  const subject = 'แอป ThaiHelper มาแล้ว — รับงานเร็วขึ้น 📱';

  const text = `สวัสดีค่ะคุณ ${name}

ตอนนี้ ThaiHelper มีแอปแล้ว ทั้ง iPhone และ Android — ดาวน์โหลดฟรี

ทำไมควรติดตั้ง
เมื่อครอบครัวส่งข้อความหาคุณ คุณจะได้รับการแจ้งเตือนบนมือถือทันที ไม่ต้องคอยเปิดเว็บไซต์เช็กเอง ครอบครัวส่วนใหญ่มักติดต่อผู้ช่วยหลายคนพร้อมกัน คนที่ตอบก่อนมักได้งาน

สิ่งที่ทำได้ในแอป
- รับการแจ้งเตือนทันทีเมื่อมีข้อความใหม่
- แชทกับครอบครัว พร้อมระบบแปลไทย-อังกฤษอัตโนมัติ
- ดูครอบครัวที่กำลังหาผู้ช่วยใกล้คุณ และทักไปก่อนได้เลย
- อัปเดตโปรไฟล์และสถานะการหางานของคุณ

iPhone: ${IOS_URL}
Android: ${PLAY_URL}

บัญชีเดิมของคุณใช้ได้เลย — เข้าสู่ระบบด้วยอีเมลและหมายเลขอ้างอิงเดิม (${ref})

ขอบคุณที่เป็นส่วนหนึ่งของ ThaiHelper
Jelena — ThaiHelper

---

Hi ${name},

ThaiHelper now has an app — for both iPhone and Android, free to download.

Why install it
When a family messages you, your phone tells you straight away. No more checking the website. Most families message several helpers at once, and the one who replies first usually gets the job.

What you can do in the app
- Instant notification the moment a message arrives
- Chat with families, with automatic Thai-English translation
- Browse families looking for help near you and message them first
- Update your profile and your job-search status

iPhone: ${IOS_URL}
Android: ${PLAY_URL}

Your existing account works right away — sign in with the same email and reference number (${ref}).

Thank you for being part of ThaiHelper,
Jelena — ThaiHelper
${unsubscribeUrl ? `\nหยุดรับอีเมลนี้ / Stop these emails: ${unsubscribeUrl}\n` : ''}`;

  const inner = `
    <p style="margin:0 0 14px;">สวัสดีค่ะคุณ <strong>${name}</strong></p>
    <p style="margin:0 0 14px;">ตอนนี้ ThaiHelper มีแอปแล้ว ทั้ง iPhone และ Android — ดาวน์โหลดฟรี</p>
    <p style="margin:0 0 6px;font-weight:700;">ทำไมควรติดตั้ง</p>
    <p style="margin:0 0 14px;">เมื่อครอบครัวส่งข้อความหาคุณ คุณจะได้รับการแจ้งเตือนบนมือถือทันที ไม่ต้องคอยเปิดเว็บไซต์เช็กเอง ครอบครัวส่วนใหญ่มักติดต่อผู้ช่วยหลายคนพร้อมกัน คนที่ตอบก่อนมักได้งาน</p>
    <p style="margin:0 0 6px;font-weight:700;">สิ่งที่ทำได้ในแอป</p>
    <ul style="margin:0 0 4px;padding-left:20px;">
      <li>รับการแจ้งเตือนทันทีเมื่อมีข้อความใหม่</li>
      <li>แชทกับครอบครัว พร้อมระบบแปลไทย-อังกฤษอัตโนมัติ</li>
      <li>ดูครอบครัวที่กำลังหาผู้ช่วยใกล้คุณ และทักไปก่อนได้เลย</li>
      <li>อัปเดตโปรไฟล์และสถานะการหางานของคุณ</li>
    </ul>
    ${buttons(TEAL)}
    <p style="margin:0 0 20px;">บัญชีเดิมของคุณใช้ได้เลย — เข้าสู่ระบบด้วยอีเมลและหมายเลขอ้างอิงเดิม (<strong>${ref}</strong>)</p>
    <hr style="border:none;border-top:1px solid #e6ecea;margin:24px 0;">
    <p style="margin:0 0 14px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 14px;">ThaiHelper now has an app — for both iPhone and Android, free to download.</p>
    <p style="margin:0 0 6px;font-weight:700;">Why install it</p>
    <p style="margin:0 0 14px;">When a family messages you, your phone tells you straight away. No more checking the website. Most families message several helpers at once, and the one who replies first usually gets the job.</p>
    <p style="margin:0 0 6px;font-weight:700;">What you can do in the app</p>
    <ul style="margin:0 0 14px;padding-left:20px;">
      <li>Instant notification the moment a message arrives</li>
      <li>Chat with families, with automatic Thai–English translation</li>
      <li>Browse families looking for help near you and message them first</li>
      <li>Update your profile and your job-search status</li>
    </ul>
    <p style="margin:0 0 18px;">Your existing account works right away — sign in with the same email and reference number (<strong>${ref}</strong>).</p>
    <p style="margin:0;">ขอบคุณที่เป็นส่วนหนึ่งของ ThaiHelper<br>Jelena — ThaiHelper</p>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: FROM,
    to: email,
    subject,
    html: shell(inner, TEAL, unsubscribeUrl, 'หยุดรับอีเมลนี้ / Stop these emails'),
    text,
    ...(unsubscribeUrl ? { headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` } } : {}),
  });
}

export async function sendEmployerAppLaunch({ firstName, email, ref, unsubscribeUrl }) {
  const name = firstName || 'there';
  const subject = 'The ThaiHelper app is here 📱';

  const text = `Hi ${name},

ThaiHelper now has an app — for both iPhone and Android, free to download.

Why install it
Helpers reply on their phones, often within minutes. With the app you get their answer as a notification instead of finding it days later in your inbox — which makes arranging an interview a lot quicker.

What you can do in the app
- Browse and filter helpers in your city, with reviews and references
- Message helpers directly, with automatic English-Thai translation built in
- Save favourites so you can compare candidates later
- Send a video-call invite straight from the chat

iPhone: ${IOS_URL}
Android: ${PLAY_URL}

Your existing account works right away — sign in with the same email and reference number (${ref}).

Best,
Jelena — ThaiHelper
${unsubscribeUrl ? `\nStop these emails: ${unsubscribeUrl}\n` : ''}`;

  const inner = `
    <p style="margin:0 0 14px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 14px;">ThaiHelper now has an app — for both iPhone and Android, free to download.</p>
    <p style="margin:0 0 6px;font-weight:700;">Why install it</p>
    <p style="margin:0 0 14px;">Helpers reply on their phones, often within minutes. With the app you get their answer as a notification instead of finding it days later in your inbox — which makes arranging an interview a lot quicker.</p>
    <p style="margin:0 0 6px;font-weight:700;">What you can do in the app</p>
    <ul style="margin:0 0 14px;padding-left:20px;">
      <li>Browse and filter helpers in your city, with reviews and references</li>
      <li>Message helpers directly, with automatic English–Thai translation built in</li>
      <li>Save favourites so you can compare candidates later</li>
      <li>Send a video-call invite straight from the chat</li>
    </ul>
    ${buttons(GOLD)}
    <p style="margin:0 0 18px;">Your existing account works right away — sign in with the same email and reference number (<strong>${ref}</strong>).</p>
    <p style="margin:0;">Best,<br>Jelena — ThaiHelper</p>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: FROM,
    to: email,
    subject,
    html: shell(inner, GOLD, unsubscribeUrl, 'Stop these emails'),
    text,
    ...(unsubscribeUrl ? { headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` } } : {}),
  });
}
