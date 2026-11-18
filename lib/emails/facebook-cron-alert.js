/**
 * Alarmmail des Facebook-Posting-Crons an ADMIN_EMAIL.
 *
 * Der einzige Grund, warum dieser Cron existiert und nicht wieder Publer:
 * Publer ist am 19.06.2026 ausgefallen und niemand hat es gemerkt, bis die
 * Seite fuenf Monate still war. Eine Automation, die stumm scheitert, ist
 * keine Automation. Diese Mail ist der Unterschied.
 *
 * Sie geht nur an die eigene Adresse — nie an Nutzer. (Projektregel: niemals
 * ungefragt Mails an Dritte senden.)
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const ADMIN = process.env.ADMIN_EMAIL || 'support@thaihelper.app';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

export async function sendFacebookCronAlert({ subject, detail }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[fb-post] RESEND_API_KEY fehlt — keine Alarmmail');
    return { skipped: true };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;line-height:1.6;color:#1B3A4B">
      <h2 style="margin:0 0 12px;font-size:18px;color:#006a62">Facebook-Cron: ${esc(subject)}</h2>
      <pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:13px;background:#f5f7f7;padding:12px;border-radius:6px;margin:0 0 16px">${esc(detail)}</pre>
      <p style="margin:0;font-size:13px;color:#5a6b74">
        Geplante Posts stehen in <code>fb_scheduled_posts</code>.
        Der Plan liegt unter <code>marketing/fb-plan-2026-11/</code>.
      </p>
    </div>
  `;

  return resend.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `[ThaiHelper] Facebook-Cron: ${subject}`,
    html,
  });
}
