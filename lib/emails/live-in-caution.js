/**
 * A quiet note to a helper who is being offered a live-in job by somebody new.
 *
 * NOT an accusation, and that is the whole design constraint. It goes out while
 * the family on the other side is still only a suspicion — sometimes one that
 * never becomes anything — so it must be useful without naming anyone, and it
 * must not make an honest live-in offer look sinister. Most live-in jobs here
 * are ordinary and good.
 *
 * What makes it worth sending anyway: the specific risk of this arrangement is
 * that the helper moves into a stranger's home before she has met him, which
 * is the one step that is genuinely hard to undo. TH-EVWECX was three messages
 * into such an offer when the work quietly changed from cooking to "help me
 * stretch my body", a trial of three days was proposed, and the conversation
 * moved to LINE — where we cannot see it. He had already asked the right
 * questions on his own. This note exists so that the ones who do not ask still
 * get the information.
 *
 * The advice is deliberately three things and no more: meet first and meet
 * somewhere public, never move in on the first day, and the job should be the
 * job that was advertised. Longer lists do not get read.
 *
 * NEVER name the account. If an account is bad enough to name, it is bad
 * enough to suspend, and then lib/emails/scam-warning.js is the letter — that
 * one is about a concrete scam that already happened and says so plainly.
 *
 * Bilingual EN + TH, Thai first in the subject: this reaches helpers, and most
 * of them read Thai.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

export function buildLiveInCaution({ firstName }) {
  const name = firstName || 'there';
  // Thai runs คุณ straight into a Thai name but needs a space before a Latin
  // one. Same rule as scam-warning.js.
  const thaiName = firstName
    ? ` คุณ${/^[฀-๿]/.test(firstName) ? '' : ' '}${firstName}`
    : '';

  const subject = 'ก่อนรับงานอยู่ประจำ / Before you take a live-in job';

  const text = `สวัสดีค่ะ${thaiName}

เราเห็นว่ามีครอบครัวเสนองานแบบอยู่ประจำให้คุณ นี่เป็นเรื่องปกติและงานอยู่ประจำส่วนใหญ่ก็เป็นงานที่ดี เราไม่ได้บอกว่ามีอะไรผิดปกติ แค่อยากฝากสามข้อไว้ เพราะงานแบบนี้ต่างจากงานไป-กลับตรงที่ถอยกลับยากกว่า

1. เจอกันก่อน และเจอในที่สาธารณะ เช่น ห้างหรือร้านกาแฟ ก่อนตกลงอะไรทั้งสิ้น
2. อย่าย้ายเข้าไปอยู่ในวันแรกที่เจอกัน ให้มีเวลาคิดอย่างน้อยหนึ่งคืน
3. งานที่ทำควรตรงกับงานที่ประกาศไว้ ถ้าหน้างานเปลี่ยนไปเป็นอย่างอื่น เช่น นวด ดูแลร่างกาย หรืออะไรที่คุณไม่ได้สมัคร คุณปฏิเสธได้เสมอ

ถ้าการคุยย้ายไปที่ LINE หรือช่องทางอื่น เราจะมองไม่เห็นและช่วยอะไรไม่ได้ ไม่เป็นไรถ้าคุณย้ายไปคุยที่นั่น แต่ถ้ามีอะไรผิดปกติ ช่วยเขียนกลับมาบอกเราที่ ${SUPPORT} เราอ่านทุกฉบับ

ขอให้โชคดีค่ะ
ทีมงาน ThaiHelper

──────────

Hello ${name},

We noticed a family has offered you a live-in position. That is completely
normal and most live-in jobs here are good ones — we are not saying anything
is wrong. Just three things worth keeping in mind, because live-in work is
harder to step back from than live-out work.

1. Meet first, and meet somewhere public — a mall or a coffee shop — before
   agreeing to anything.
2. Do not move in on the day you first meet. Give yourself at least one night
   to think.
3. The work should be the work that was advertised. If it turns into something
   else on the day — massage, physical care, anything you did not apply for —
   you can always say no.

If the conversation moves to LINE or somewhere else, we cannot see it and
cannot help. That is fine, people do it all the time. But if anything feels
wrong, write to us at ${SUPPORT}. We read every message.

Good luck,
The ThaiHelper team`;

  const p = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.65;"';
  const pTh = 'style="margin:0 0 14px;font-size:15px;color:#333;line-height:1.8;"';
  const li = 'style="margin:0 0 10px;font-size:14px;color:#1a1a1a;line-height:1.65;"';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#222;">
<div style="max-width:540px;margin:32px auto;padding:0 18px;">
  <div style="background:#fff;border-radius:14px;padding:28px;border-top:4px solid #006a62;">

    <p ${pTh}>สวัสดีค่ะ${esc(thaiName)}</p>
    <p ${pTh}>เราเห็นว่ามีครอบครัวเสนองานแบบอยู่ประจำให้คุณ นี่เป็นเรื่องปกติและงานอยู่ประจำส่วนใหญ่ก็เป็นงานที่ดี เราไม่ได้บอกว่ามีอะไรผิดปกติ แค่อยากฝากสามข้อไว้</p>
    <div style="background:#eef7f5;border-left:4px solid #006a62;padding:14px 18px;border-radius:8px;margin:0 0 18px;">
      <p ${li}><strong>1.</strong> เจอกันก่อน และเจอในที่สาธารณะ ก่อนตกลงอะไรทั้งสิ้น</p>
      <p ${li}><strong>2.</strong> อย่าย้ายเข้าไปอยู่ในวันแรกที่เจอกัน</p>
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.65;"><strong>3.</strong> งานที่ทำควรตรงกับงานที่ประกาศไว้ ถ้าเปลี่ยนเป็นอย่างอื่นที่คุณไม่ได้สมัคร คุณปฏิเสธได้เสมอ</p>
    </div>
    <p ${pTh}>ถ้าการคุยย้ายไปที่ LINE เราจะมองไม่เห็นและช่วยอะไรไม่ได้ ถ้ามีอะไรผิดปกติ เขียนมาที่ <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a> ได้เสมอค่ะ</p>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:26px 0;">

    <p ${p}>Hello ${esc(name)},</p>
    <p ${p}>We noticed a family has offered you a live-in position. That is completely normal and most live-in jobs here are good ones — we are not saying anything is wrong. Just three things worth keeping in mind, because live-in work is harder to step back from.</p>
    <div style="background:#eef7f5;border-left:4px solid #006a62;padding:14px 18px;border-radius:8px;margin:0 0 18px;">
      <p ${li}><strong>1.</strong> Meet first, and meet somewhere public, before agreeing to anything.</p>
      <p ${li}><strong>2.</strong> Do not move in on the day you first meet. Give yourself a night to think.</p>
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.65;"><strong>3.</strong> The work should be the work that was advertised. If it turns into something else — massage, physical care, anything you did not apply for — you can always say no.</p>
    </div>
    <p ${p}>If the conversation moves to LINE we cannot see it and cannot help. That is fine, people do it all the time. But if anything feels wrong, write to us at <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a>. We read every message.</p>

    <p style="margin:24px 0 0;font-size:14px;color:#666;">The ThaiHelper team</p>

  </div>
</div>
</body></html>`;

  return { subject, text, html };
}

export async function sendLiveInCaution({ firstName, email }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildLiveInCaution({ firstName });
  // Always include the text part — see the SPF/DKIM/DMARC notes.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
