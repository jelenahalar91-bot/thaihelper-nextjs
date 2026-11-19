/**
 * "The season is starting — are you still looking?"
 *
 * To the helpers who have not been on the site for four months and so are no
 * longer in the directory — see hiddenForInactivity() in lib/access.js and
 * INACTIVE_AFTER_DAYS, which this letter must agree with. 465 of them at the
 * time of writing, the longest absent since 2026-05-11.
 *
 * IT LEADS WITH THE JOBS, NOT WITH THE DEADLINE. The first draft opened by
 * telling her she had been unlisted and closed by threatening to delete the
 * account — true, and a reason to put the mail down. What might actually move
 * somebody who stopped looking in July is that high season has started and
 * there is work on the site now. The housekeeping is the last paragraph,
 * where it belongs.
 *
 * THE NUMBERS ARE PASSED IN, NOT WRITTEN HERE, and the caller rounds them
 * down to the nearest ten before passing them. A letter that claims "over 300
 * jobs" on the day the real figure is 302 is one hidden listing away from
 * being false, and we would never notice.
 *
 * ONE PRESS IS THE WHOLE ASK. The primary button is /api/still-looking, which
 * puts her back in the directory without a login — most of these women cannot
 * get in, which is the entire problem. See lib/still-looking.js for why that
 * link marks a profile active rather than minting a session.
 *
 * THE REF NUMBER IS STILL IN THE LETTER, for the ones who want to go further
 * and edit the profile or read their messages. It is not a secret: it appears
 * on her own public card, and it gets nobody past the address it has to be
 * paired with.
 *
 * WHAT THE DEADLINE DOES AND DOES NOT DO. It is the date after which we go
 * through the accounts that never answered and close them. Nothing reads it:
 * no cron, nothing deletes itself. Removing an account is a person's decision
 * taken on a list, because the group most likely to miss this letter is the
 * same group it describes — somebody locked out of her email can neither read
 * the warning nor do the thing it asks.
 *
 * Thai first for Thai nationals, by nationality rather than by the languages
 * field — see the match-email notes. Everyone else gets English first. Both
 * halves are always present. All Thai copy goes through
 * scripts/check-thai-copy.mjs before it is sent.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';
const LOGIN = 'https://www.thaihelper.app/login';
const JOBS = 'https://www.thaihelper.app/employers-browse';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=app.thaihelper.mobile';
const IOS_URL = 'https://apps.apple.com/app/thaihelper-app/id6801794164';

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
 * @param {object} o
 * @param {string} o.firstName
 * @param {string} o.ref             her helper ref, e.g. TH-LXI3KK
 * @param {number|Date} o.deadline   the date named in the letter
 * @param {string} o.stillLookingUrl one-press reactivation link
 * @param {number} o.jobCount        already rounded DOWN by the caller
 * @param {number} o.familyCount     already rounded DOWN by the caller
 * @param {boolean} o.thaiFirst      nationality === 'thai'
 * @param {string} [o.unsubscribeUrl]
 */
export function buildReactivateOrRemove({
  firstName, ref, deadline, stillLookingUrl, jobCount, familyCount,
  thaiFirst = false, unsubscribeUrl = '',
}) {
  const name = firstName || 'there';
  const th = firstName ? ` คุณ${firstName}` : '';
  const dEn = formatDate(deadline, 'en');
  const dTh = formatDate(deadline, 'th');

  const subject = thaiFirst
    ? `ช่วงไฮซีซั่นเริ่มแล้ว — มีงานเปิดรับกว่า ${jobCount} ตำแหน่ง`
    : `High season has started — ${jobCount}+ jobs are open right now`;

  const textEn = `Hi ${name},

High season has started in Thailand and families are posting again. There are
over ${jobCount} jobs on ThaiHelper right now, from more than ${familyCount}
families, and more arrive every week.

You have a profile with us, but we have not seen you for a few months — so we
have taken it out of the list for now, to keep the site honest about who is
actually available. Nothing has been deleted.

ARE YOU STILL LOOKING FOR WORK?
One press is all it takes. Your profile goes straight back into the list and
families can find you again:

  ${stillLookingUrl}

HAVING TROUBLE SIGNING IN?
That is the most common reason people disappear. You sign in with this email
address and your number:

  ${ref}

  Sign in:  ${LOGIN}

If it still will not let you in, reply to this email and I will sort it out
personally.

HAVE YOU GOT THE APP?
Messages reach you much faster on your phone than by email.

  iPhone:   ${IOS_URL}
  Android:  ${PLAY_URL}

Browse the open jobs: ${JOBS}

──

If you are not looking any more, that is completely fine and you do not owe us
an explanation. We just want the site to be up to date, so after ${dEn} we will
close the accounts we have not heard from. If you would rather keep yours for
later, just reply and say so.

Jelena
Founder, thaihelper.app
${SUPPORT}`;

  const textTh = `สวัสดีค่ะ${th}

ช่วงไฮซีซั่นในประเทศไทยเริ่มแล้ว และครอบครัวต่าง ๆ กลับมาประกาศหาผู้ช่วยอีกครั้ง ขณะนี้มีงานบน ThaiHelper มากกว่า ${jobCount} ตำแหน่ง จากครอบครัวมากกว่า ${familyCount} ครอบครัว และมีงานใหม่เข้ามาทุกสัปดาห์

คุณมีโปรไฟล์อยู่กับเรา แต่เราไม่เห็นคุณเข้ามาหลายเดือนแล้ว เราจึงนำโปรไฟล์ออกจากรายชื่อไว้ก่อน เพื่อให้รายชื่อบนเว็บไซต์ตรงกับผู้ที่พร้อมทำงานจริง ๆ ทั้งนี้ไม่มีข้อมูลใดถูกลบ

คุณยังหางานอยู่ไหมคะ
กดเพียงครั้งเดียวเท่านั้น โปรไฟล์ของคุณจะกลับเข้าไปอยู่ในรายชื่อทันที และครอบครัวที่กำลังหาผู้ช่วยจะค้นหาคุณเจออีกครั้ง

  ${stillLookingUrl}

เข้าสู่ระบบไม่ได้ใช่ไหมคะ
นี่คือสาเหตุที่พบบ่อยที่สุดที่ทำให้หลายคนหายไป คุณสามารถเข้าสู่ระบบด้วยอีเมลฉบับนี้ พร้อมรหัสประจำตัวของคุณ

  ${ref}

  เข้าสู่ระบบ:  ${LOGIN}

หากยังเข้าไม่ได้ กรุณาตอบกลับอีเมลนี้ แล้วดิฉันจะช่วยจัดการให้เองค่ะ

คุณดาวน์โหลดแอปแล้วหรือยังคะ
ข้อความจากครอบครัวที่กำลังหาผู้ช่วยจะส่งถึงคุณเร็วกว่าทางอีเมลมาก

  iPhone:   ${IOS_URL}
  Android:  ${PLAY_URL}

ดูงานที่เปิดรับอยู่: ${JOBS}

──

หากคุณไม่ได้หางานแล้ว ก็ไม่เป็นไรเลยค่ะ และคุณไม่จำเป็นต้องอธิบายอะไรกับเรา เราเพียงอยากให้ข้อมูลบนเว็บไซต์เป็นปัจจุบัน ดังนั้นหลังวันที่ ${dTh} เราจะปิดบัญชีที่ไม่ได้ตอบกลับมา หากคุณอยากเก็บบัญชีไว้ใช้ในอนาคต กรุณาตอบกลับมาบอกเราได้เลยค่ะ

เจเลนา
ผู้ก่อตั้ง thaihelper.app
${SUPPORT}`;

  const text = thaiFirst
    ? `${textTh}\n\n──────────\n\n${textEn}`
    : `${textEn}\n\n──────────\n\n${textTh}`;

  const p = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;"';
  const pTh = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.85;"';
  const h = 'style="margin:24px 0 8px;font-size:16px;color:#1B3A4B;font-weight:700;line-height:1.4;"';
  const hTh = 'style="margin:24px 0 8px;font-size:16px;color:#1B3A4B;font-weight:700;line-height:1.7;"';
  const btn = 'style="display:inline-block;background:#006a62;color:#fff;text-decoration:none;padding:14px 26px;border-radius:8px;font-weight:700;font-size:16px;"';
  const small = 'style="margin:0 0 14px;font-size:14px;color:#666;line-height:1.65;"';
  const smallTh = 'style="margin:0 0 14px;font-size:14px;color:#666;line-height:1.85;"';
  const refBox = 'style="background:#f0f7f6;border-left:4px solid #006a62;padding:12px 16px;border-radius:8px;margin:0 0 14px;"';
  const seasonEn = 'style="background:#fdf4e7;border-radius:10px;padding:16px 18px;margin:0 0 20px;font-size:15px;line-height:1.6;color:#1a1a1a;"';
  const seasonTh = 'style="background:#fdf4e7;border-radius:10px;padding:16px 18px;margin:0 0 20px;font-size:15px;line-height:1.85;color:#1a1a1a;"';

  const blockEn = `
    <p ${p}>Hi ${esc(name)},</p>
    <div ${seasonEn}>
      <strong>High season has started</strong> and families are posting again —
      over <strong>${esc(jobCount)} jobs</strong> are open on ThaiHelper right now,
      from more than ${esc(familyCount)} families, with more every week.
    </div>
    <p ${p}>You have a profile with us, but we have not seen you for a few months — so we have taken it out of the list for now, to keep the site honest about who is actually available. <strong>Nothing has been deleted.</strong></p>

    <p ${h}>Are you still looking for work?</p>
    <p ${p}>One press is all it takes. Your profile goes straight back into the list and families can find you again.</p>
    <p style="margin:0 0 18px;"><a href="${stillLookingUrl}" ${btn}>Yes, I am still looking</a></p>

    <p ${h}>Having trouble signing in?</p>
    <p ${small}>That is the most common reason people disappear. You sign in with this email address and your number:</p>
    <div ${refBox}>
      <strong style="font-family:ui-monospace,Menlo,monospace;font-size:17px;color:#006a62;">${esc(ref)}</strong>
    </div>
    <p ${small}><a href="${LOGIN}" style="color:#006a62;font-weight:600;">Sign in here</a> — and if it still will not let you in, reply to this email and I will sort it out personally.</p>

    <p ${h}>Have you got the app?</p>
    <p ${small}>Messages reach you much faster on your phone than by email.<br>
      <a href="${IOS_URL}" style="color:#006a62;font-weight:600;">iPhone</a> ·
      <a href="${PLAY_URL}" style="color:#006a62;font-weight:600;">Android</a>
    </p>
    <p ${small}><a href="${JOBS}" style="color:#006a62;font-weight:600;">Browse the open jobs &rarr;</a></p>

    <p ${small}>If you are not looking any more, that is completely fine and you do not owe us an explanation. We just want the site to be up to date, so <strong>after ${esc(dEn)}</strong> we will close the accounts we have not heard from. If you would rather keep yours for later, just reply and say so.</p>`;

  const blockTh = `
    <p ${pTh}>สวัสดีค่ะ${esc(th)}</p>
    <div ${seasonTh}>
      <strong>ช่วงไฮซีซั่นเริ่มแล้ว</strong> และครอบครัวต่าง ๆ กลับมาประกาศหาผู้ช่วยอีกครั้ง ขณะนี้มีงานเปิดรับบน ThaiHelper <strong>มากกว่า ${esc(jobCount)} ตำแหน่ง</strong> จากครอบครัวกว่า ${esc(familyCount)} ครอบครัว และมีงานใหม่เข้ามาทุกสัปดาห์
    </div>
    <p ${pTh}>คุณมีโปรไฟล์อยู่กับเรา แต่เราไม่เห็นคุณเข้ามาหลายเดือนแล้ว เราจึงนำโปรไฟล์ออกจากรายชื่อไว้ก่อน เพื่อให้รายชื่อบนเว็บไซต์ตรงกับผู้ที่พร้อมทำงานจริง ๆ <strong>ทั้งนี้ไม่มีข้อมูลใดถูกลบ</strong></p>

    <p ${hTh}>คุณยังหางานอยู่ไหมคะ</p>
    <p ${pTh}>กดเพียงครั้งเดียวเท่านั้น โปรไฟล์ของคุณจะกลับเข้าไปอยู่ในรายชื่อทันที และครอบครัวที่กำลังหาผู้ช่วยจะค้นหาคุณเจออีกครั้ง</p>
    <p style="margin:0 0 18px;"><a href="${stillLookingUrl}" ${btn}>ใช่ ฉันยังหางานอยู่</a></p>

    <p ${hTh}>เข้าสู่ระบบไม่ได้ใช่ไหมคะ</p>
    <p ${smallTh}>นี่คือสาเหตุที่พบบ่อยที่สุดที่ทำให้หลายคนหายไป คุณสามารถเข้าสู่ระบบด้วยอีเมลฉบับนี้ พร้อมรหัสประจำตัวของคุณ</p>
    <div ${refBox}>
      <strong style="font-family:ui-monospace,Menlo,monospace;font-size:17px;color:#006a62;">${esc(ref)}</strong>
    </div>
    <p ${smallTh}><a href="${LOGIN}" style="color:#006a62;font-weight:600;">เข้าสู่ระบบที่นี่</a> — หากยังเข้าไม่ได้ กรุณาตอบกลับอีเมลนี้ แล้วดิฉันจะช่วยจัดการให้เองค่ะ</p>

    <p ${hTh}>คุณดาวน์โหลดแอปแล้วหรือยังคะ</p>
    <p ${smallTh}>ข้อความจากครอบครัวที่กำลังหาผู้ช่วยจะส่งถึงคุณเร็วกว่าทางอีเมลมาก<br>
      <a href="${IOS_URL}" style="color:#006a62;font-weight:600;">iPhone</a> ·
      <a href="${PLAY_URL}" style="color:#006a62;font-weight:600;">Android</a>
    </p>
    <p ${smallTh}><a href="${JOBS}" style="color:#006a62;font-weight:600;">ดูงานที่เปิดรับอยู่ &rarr;</a></p>

    <p ${smallTh}>หากคุณไม่ได้หางานแล้ว ก็ไม่เป็นไรเลยค่ะ และคุณไม่จำเป็นต้องอธิบายอะไรกับเรา เราเพียงอยากให้ข้อมูลบนเว็บไซต์เป็นปัจจุบัน ดังนั้น<strong>หลังวันที่ ${esc(dTh)}</strong> เราจะปิดบัญชีที่ไม่ได้ตอบกลับมา หากคุณอยากเก็บบัญชีไว้ใช้ในอนาคต กรุณาตอบกลับมาบอกเราได้เลยค่ะ</p>`;

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
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0;">
${second}
    <p style="margin:26px 0 0;">Jelena<br><span style="color:#666;font-size:14px;">Founder, thaihelper.app · <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a></span></p>
    ${unsub}
  </div>
</div>
</body></html>`;

  return { subject, text, html };
}

/**
 * The same thing as a LINE push, which is a different medium and not a place
 * to paste an email into. LINE is read on a phone in a chat list, so it gets
 * the season, the one button and nothing else — the ref number, the app links
 * and the deadline stay in the mail, which every one of these helpers is also
 * getting. One language, not two: LINE has no subject line and a bilingual
 * block of double the length gets scrolled past.
 */
export function buildLineMessage({ firstName, stillLookingUrl, jobCount, thaiFirst = true }) {
  if (thaiFirst) {
    const name = firstName ? ` คุณ${firstName}` : '';
    return `สวัสดีค่ะ${name} 🙏

ช่วงไฮซีซั่นเริ่มแล้ว ขณะนี้มีงานเปิดรับบน ThaiHelper มากกว่า ${jobCount} ตำแหน่ง

เราไม่เห็นคุณเข้ามาหลายเดือนแล้ว จึงนำโปรไฟล์ออกจากรายชื่อไว้ก่อน ทั้งนี้ไม่มีข้อมูลใดถูกลบค่ะ

หากคุณยังหางานอยู่ กดลิงก์นี้เพียงครั้งเดียว โปรไฟล์ของคุณจะกลับเข้าไปอยู่ในรายชื่อทันที
${stillLookingUrl}

รายละเอียดทั้งหมดอยู่ในอีเมลที่เราเพิ่งส่งให้ค่ะ
— เจเลนา, ThaiHelper`;
  }
  const name = firstName ? ` ${firstName}` : '';
  return `Hi${name} 🙏

High season has started — there are over ${jobCount} jobs open on ThaiHelper right now.

We have not seen you for a few months, so your profile is out of the list for the moment. Nothing has been deleted.

Still looking for work? One press puts you straight back in:
${stillLookingUrl}

The full details are in the email we just sent you.
— Jelena, ThaiHelper`;
}

export async function sendReactivateOrRemove(opts) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildReactivateOrRemove(opts);
  // Always include the text part — see the SPF/DKIM/DMARC notes.
  return resend.emails.send({ from: FROM, to: opts.email, subject, text, html });
}
