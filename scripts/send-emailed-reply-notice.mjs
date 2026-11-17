#!/usr/bin/env node
/**
 * Tell somebody who answered a notification mail by email that their text was
 * forwarded into the chat by hand — and where to answer next time.
 *
 * Companion to scripts/forward-emailed-reply.mjs: that one moves the text to
 * where it belongs, this one closes the loop with the person who is otherwise
 * sitting there waiting for an answer to a mail nobody received.
 *
 * Wording is the approved draft in drafts/phichayapha-reply-th.md.
 * SAFETY: dry-run is the DEFAULT. Nothing is sent without --live.
 *
 *   node scripts/send-emailed-reply-notice.mjs --case=pichayapa
 *   node scripts/send-emailed-reply-notice.mjs --case=pichayapa --live
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}
const { Resend } = await import('resend');

const args = process.argv.slice(2);
const live = args.includes('--live');
const which = (args.find((a) => a.startsWith('--case='))?.slice(7) || '').trim();

const CASES = {
  pichayapa: {
    to: 'phichayakun308@gmail.com',
    subject: 'ส่งข้อความของคุณให้คุณ Melissa แล้วค่ะ',
    paragraphs: [
      'สวัสดีค่ะ คุณพิชญาภา',
      'ขอบคุณสำหรับคำถามค่ะ ข้อความที่คุณตอบกลับมาทางอีเมลไม่ได้ส่งถึงคุณ Melissa โดยตรง เพราะอีเมลฉบับนั้นเป็นเพียงการแจ้งเตือนจากระบบ ทีมงานจึงนำข้อความของคุณไปใส่ไว้ในแชทกับคุณ Melissa ให้แล้วค่ะ และแจ้งเตือนคุณ Melissa เรียบร้อยแล้วค่ะ',
      'ครั้งต่อไปกรุณาเข้าสู่ระบบที่ https://thaihelper.app/profile แล้วตอบในแชทโดยตรงนะคะ คุณ Melissa จะตอบกลับคุณในแชทนั้นค่ะ',
      'ขอบคุณค่ะ',
      'ทีมงาน ThaiHelper',
    ],
  },
};

const c = CASES[which];
if (!c) {
  console.error(`Unknown --case. Known: ${Object.keys(CASES).join(', ')}`);
  process.exit(1);
}

const text = c.paragraphs.join('\n\n');
const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Sarabun','Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>
    <div style="background:#fff;border-radius:16px;padding:32px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      ${c.paragraphs.map((p) => `<p style="font-size:15px;color:#333;line-height:1.8;margin:0 0 16px;">${p.replace(
        /(https:\/\/\S+)/g,
        '<a href="$1" style="color:#006a62;">$1</a>',
      )}</p>`).join('\n      ')}
    </div>
  </div>
</body></html>`;

console.log(`To      : ${c.to}`);
console.log(`Subject : ${c.subject}`);
console.log(`\n${text}\n`);

if (!live) {
  console.log('DRY RUN — nothing sent. Re-run with --live.');
  process.exit(0);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const res = await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: c.to,
  replyTo: process.env.ADMIN_EMAIL,
  subject: c.subject,
  html,
  text,
});
console.log(res.error ? `FAILED: ${res.error.message}` : `Sent — id ${res.data.id}`);
