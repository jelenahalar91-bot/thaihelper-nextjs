/**
 * "Log in and your profile comes back, or tell us and we'll close the account."
 *
 * To the helpers who have not been on the site for four months and so are no
 * longer in the directory — see hiddenForInactivity() in lib/access.js and
 * INACTIVE_AFTER_DAYS, which this letter must agree with. 475 of them at the
 * time of writing, the longest absent since 2026-05-11.
 *
 * WHY THE REF NUMBER IS IN THE LETTER. There are two reasons a helper goes
 * quiet, and we can only guess which: she stopped looking, or she cannot get
 * back in. The second group cannot be told anything useful by a letter that
 * only says "log in" — the thing they have lost IS the way in. Helpers sign in
 * with their email plus a ref number they were given once, months ago, in an
 * email they have probably deleted. So the letter carries it. It is not a
 * secret: it appears on her own public profile card, and knowing it gets
 * nobody past the email address it has to be paired with.
 *
 * NO MAGIC LINK, deliberately, even though /api/auth/magic-link exists and
 * would be one click instead of two. Those tokens live 15 minutes
 * (TOKEN_TTL_MS), which is the right length for a link somebody just asked for
 * and useless for a letter that may be read tomorrow. Minting 475 long-lived
 * ones to work around that would leave 475 standing session keys sitting in
 * inboxes we know are unattended — the exact inboxes most likely to be
 * abandoned or compromised. The login page can issue her a fresh one in the
 * moment she is actually there.
 *
 * WHAT THE DEADLINE DOES AND DOES NOT DO. It is the date after which we will
 * go through the accounts that never answered and close them. It is not wired
 * to anything: no cron reads it, nothing deletes itself. Removing an account
 * is a person's decision taken on a list, because the group most likely to
 * miss this letter is the same group it describes — someone locked out of her
 * email cannot read the warning OR do the thing it asks. Automating deletion
 * on silence would hit exactly her.
 *
 * Thai first for Thai nationals, by nationality rather than by the languages
 * field — see the match-email notes. Everyone else gets English first. Both
 * halves are always present.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';
const LOGIN = 'https://www.thaihelper.app/login';

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
 * @param {string} opts.ref            her helper ref, e.g. TH-LXI3KK
 * @param {number|Date} opts.lastSeen  last_login_at, or created_at if never
 * @param {number|Date} opts.deadline  the date named in the letter
 * @param {boolean} opts.thaiFirst     nationality === 'thai'
 * @param {string} [opts.unsubscribeUrl]
 */
export function buildReactivateOrRemove({
  firstName, ref, lastSeen, deadline, thaiFirst = false, unsubscribeUrl = '',
}) {
  const name = firstName || 'there';
  const th = firstName ? ` คุณ${firstName}` : '';
  const seenEn = formatDate(lastSeen, 'en');
  const seenTh = formatDate(lastSeen, 'th');
  const dEn = formatDate(deadline, 'en');
  const dTh = formatDate(deadline, 'th');

  const subject = thaiFirst
    ? 'โปรไฟล์ ThaiHelper ของคุณไม่แสดงอยู่ในรายชื่อแล้ว'
    : 'Your ThaiHelper profile is no longer being shown';

  const textEn = `Hi ${name},

You last signed in to ThaiHelper on ${seenEn}, and we have not seen you since.
Because of that, your profile is no longer shown to families looking for help.

Nothing has been deleted. Your profile, your messages and your account are all
still there, exactly as you left them.

IF YOU ARE STILL LOOKING FOR WORK
Just sign in once and your profile goes back into the list straight away. You
do not have to tell us, and you do not have to change anything.

  Sign in here:   ${LOGIN}
  Your email:     the address this letter came to
  Your number:    ${ref}

That number is what people usually lose, so there it is. If you cannot get in
even with it, reply to this email and I will sort it out personally.

IF YOU ARE NOT LOOKING ANY MORE
That is completely fine, and you do not owe us an explanation. We would rather
close the account than leave it sitting there, so after ${dEn} we will go
through the accounts that never replied and remove them, together with the
messages and documents in them.

If you would rather keep the account for later, just reply and say so, and I
will leave it alone.

Thank you either way — and I am sorry if a family wrote to you and you never
saw it.

Jelena
Founder, thaihelper.app
${SUPPORT}`;

  const textTh = `สวัสดีค่ะ${th}

คุณเข้าสู่ระบบ ThaiHelper ครั้งล่าสุดเมื่อวันที่ ${seenTh} และหลังจากนั้นเราไม่พบคุณอีกเลย
ด้วยเหตุนี้ โปรไฟล์ของคุณจึงไม่แสดงให้ครอบครัวที่กำลังมองหาผู้ช่วยเห็นแล้ว

ไม่มีอะไรถูกลบ โปรไฟล์ ข้อความ และบัญชีของคุณยังอยู่ครบเหมือนเดิมทุกอย่าง

ถ้าคุณยังหางานอยู่
เพียงเข้าสู่ระบบหนึ่งครั้ง โปรไฟล์ของคุณจะกลับเข้าไปอยู่ในรายชื่อทันที ไม่ต้องแจ้งเรา และไม่ต้องแก้ไขอะไร

  เข้าสู่ระบบที่นี่:   ${LOGIN}
  อีเมลของคุณ:        อีเมลที่ได้รับจดหมายฉบับนี้
  รหัสประจำตัวของคุณ:   ${ref}

รหัสประจำตัวนี้คือสิ่งที่คนส่วนใหญ่ทำหาย เราจึงใส่มาให้ หากใส่รหัสแล้วยังเข้าไม่ได้ กรุณาตอบกลับอีเมลนี้ แล้วดิฉันจะช่วยจัดการให้เองค่ะ

ถ้าคุณไม่ได้หางานแล้ว
ไม่เป็นไรเลยค่ะ และคุณไม่จำเป็นต้องอธิบายอะไรกับเรา เราอยากปิดบัญชีมากกว่าปล่อยทิ้งไว้เฉย ๆ ดังนั้นหลังวันที่ ${dTh} เราจะตรวจสอบบัญชีที่ไม่ได้ตอบกลับและลบออก พร้อมกับข้อความและเอกสารที่อยู่ในบัญชีนั้น

หากคุณอยากเก็บบัญชีไว้ใช้ในอนาคต กรุณาตอบกลับมาบอกเรา แล้วเราจะไม่ลบบัญชีของคุณค่ะ

ขอบคุณค่ะ ไม่ว่าคุณจะเลือกทางไหน และดิฉันต้องขออภัยหากมีครอบครัวที่กำลังหาผู้ช่วยส่งข้อความถึงคุณ แล้วคุณไม่ได้เห็นข้อความนั้น

เจเลนา
ผู้ก่อตั้ง thaihelper.app
${SUPPORT}`;

  const text = thaiFirst
    ? `${textTh}\n\n──────────\n\n${textEn}`
    : `${textEn}\n\n──────────\n\n${textTh}`;

  const p = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;"';
  const pTh = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.8;"';
  const h = 'style="margin:22px 0 10px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#006a62;font-weight:700;"';
  const hTh = 'style="margin:22px 0 10px;font-size:15px;color:#006a62;font-weight:700;line-height:1.8;"';
  const btn = 'style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;"';
  const box = 'style="background:#f0f7f6;border-left:4px solid #006a62;padding:14px 18px;border-radius:8px;margin:0 0 18px;font-size:14px;line-height:1.7;color:#1a1a1a;"';

  const blockEn = `
    <p ${p}>Hi ${esc(name)},</p>
    <p ${p}>You last signed in to ThaiHelper on <strong>${esc(seenEn)}</strong>, and we have not seen you since. Because of that, your profile is <strong>no longer shown</strong> to families looking for help.</p>
    <p ${p}>Nothing has been deleted. Your profile, your messages and your account are all still there, exactly as you left them.</p>

    <p ${h}>If you are still looking for work</p>
    <p ${p}>Just sign in once and your profile goes back into the list straight away. You do not have to tell us, and you do not have to change anything.</p>
    <div ${box}>
      Your email: the address this letter came to<br>
      Your number: <strong style="font-family:ui-monospace,Menlo,monospace;font-size:16px;">${esc(ref)}</strong>
    </div>
    <p style="margin:0 0 14px;"><a href="${LOGIN}" ${btn}>Sign in</a></p>
    <p ${p}>That number is what people usually lose, so there it is. If you cannot get in even with it, reply to this email and I will sort it out personally.</p>

    <p ${h}>If you are not looking any more</p>
    <p ${p}>That is completely fine, and you do not owe us an explanation. We would rather close the account than leave it sitting there, so <strong>after ${esc(dEn)}</strong> we will go through the accounts that never replied and remove them, together with the messages and documents in them.</p>
    <p ${p}>If you would rather keep the account for later, just reply and say so, and I will leave it alone.</p>
    <p ${p}>Thank you either way — and I am sorry if a family wrote to you and you never saw it.</p>`;

  const blockTh = `
    <p ${pTh}>สวัสดีค่ะ${esc(th)}</p>
    <p ${pTh}>คุณเข้าสู่ระบบ ThaiHelper ครั้งล่าสุดเมื่อวันที่ <strong>${esc(seenTh)}</strong> และหลังจากนั้นเราไม่พบคุณอีกเลย ด้วยเหตุนี้ โปรไฟล์ของคุณจึง<strong>ไม่แสดงให้ครอบครัวที่กำลังหาผู้ช่วยเห็นแล้ว</strong></p>
    <p ${pTh}>ไม่มีอะไรถูกลบ โปรไฟล์ ข้อความ และบัญชีของคุณยังอยู่ครบเหมือนเดิมทุกอย่าง</p>

    <p ${hTh}>ถ้าคุณยังหางานอยู่</p>
    <p ${pTh}>เพียงเข้าสู่ระบบหนึ่งครั้ง โปรไฟล์ของคุณจะกลับเข้าไปอยู่ในรายชื่อทันที ไม่ต้องแจ้งเรา และไม่ต้องแก้ไขอะไร</p>
    <div ${box}>
      อีเมลของคุณ: อีเมลที่ได้รับจดหมายฉบับนี้<br>
      รหัสประจำตัวของคุณ: <strong style="font-family:ui-monospace,Menlo,monospace;font-size:16px;">${esc(ref)}</strong>
    </div>
    <p style="margin:0 0 14px;"><a href="${LOGIN}" ${btn}>เข้าสู่ระบบ</a></p>
    <p ${pTh}>รหัสประจำตัวนี้คือสิ่งที่คนส่วนใหญ่ทำหาย เราจึงใส่มาให้ หากใส่รหัสแล้วยังเข้าไม่ได้ กรุณาตอบกลับอีเมลนี้ แล้วดิฉันจะช่วยจัดการให้เองค่ะ</p>

    <p ${hTh}>ถ้าคุณไม่ได้หางานแล้ว</p>
    <p ${pTh}>ไม่เป็นไรเลยค่ะ และคุณไม่จำเป็นต้องอธิบายอะไรกับเรา เราอยากปิดบัญชีมากกว่าปล่อยทิ้งไว้เฉย ๆ ดังนั้น<strong>หลังวันที่ ${esc(dTh)}</strong> เราจะตรวจสอบบัญชีที่ไม่ได้ตอบกลับและลบออก พร้อมกับข้อความและเอกสารที่อยู่ในบัญชีนั้น</p>
    <p ${pTh}>หากคุณอยากเก็บบัญชีไว้ใช้ในอนาคต กรุณาตอบกลับมาบอกเรา แล้วเราจะไม่ลบบัญชีของคุณค่ะ</p>
    <p ${pTh}>ขอบคุณค่ะ ไม่ว่าคุณจะเลือกทางไหน และดิฉันต้องขออภัยหากมีครอบครัวที่กำลังหาผู้ช่วยส่งข้อความถึงคุณ แล้วคุณไม่ได้เห็นข้อความนั้น</p>`;

  const first = thaiFirst ? blockTh : blockEn;
  const second = thaiFirst ? blockEn : blockTh;

  const unsub = unsubscribeUrl
    ? `<p style="margin:18px 0 0;font-size:12px;color:#999;">
         <a href="${unsubscribeUrl}" style="color:#999;">Stop receiving emails from ThaiHelper</a> ·
         <a href="${unsubscribeUrl}" style="color:#999;">ยกเลิกรับอีเมล</a>
       </p>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#222;">
<div style="max-width:540px;margin:32px auto;padding:0 18px;">
  <div style="background:#fff;border-radius:14px;padding:28px;border-top:4px solid #006a62;">
${first}
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:26px 0;">
${second}
    <p style="margin:24px 0 0;">Jelena<br><span style="color:#666;font-size:14px;">Founder, thaihelper.app · <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a></span></p>
    ${unsub}
  </div>
</div>
</body></html>`;

  return { subject, text, html };
}

export async function sendReactivateOrRemove(opts) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildReactivateOrRemove(opts);
  // Always include the text part — see the SPF/DKIM/DMARC notes.
  return resend.emails.send({ from: FROM, to: opts.email, subject, text, html });
}
