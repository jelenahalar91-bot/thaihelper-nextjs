/**
 * "I was hired by you" — the helper's side of closing the loop.
 *
 * Hiring happens off-platform: two people exchange a phone number, meet, and
 * the platform never hears about it. That is why the review counter sat at
 * three in three and a half months. This email is the one moment where a
 * helper can tell us a job happened, and it asks the family — once — to say
 * how it went.
 *
 * Rules that keep this from becoming a nagging machine:
 *   - Only a helper who has an actual conversation with that family can
 *     trigger it (checked in pages/api/hire-confirmation.js).
 *   - UNIQUE(helper_ref, employer_ref) in hire_confirmations means one email
 *     per pair, ever. No reminders, no second try.
 *   - It never claims the family owes a review. The helper is telling them
 *     something true and asking; that is all.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@thaihelper.app';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

/**
 * @param {object} p
 * @param {string} p.employerName   - family first name
 * @param {string} p.employerEmail
 * @param {string} p.helperName     - helper first name
 * @param {string} p.unsubscribeUrl - optional; same footer as message mails
 */
export async function sendHireConfirmedEmail({
  employerName, employerEmail, helperName, unsubscribeUrl,
}) {
  const name = employerName || 'there';
  const helper = helperName || 'Your helper';
  const dashboard = 'https://thaihelper.app/employer-dashboard';

  const text = `Hi ${name},

${helper} told us that you hired her — congratulations, that is exactly what this
platform is for.

If she has already started, would you write a short review? It takes a minute,
and it is the only thing future families have to go on when they are deciding
whether to trust someone they have never met.

Open your conversation with ${helper} and the rating box is right there in the chat:
${dashboard}

If ${helper} has not actually worked for you, just ignore this email — nothing
happens, and we will not ask again.

Jelena
thaihelper.app
${unsubscribeUrl ? `\nStop these emails: ${unsubscribeUrl}\n` : ''}`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">
        ${esc(helper)} says you hired her 🎉
      </h1>

      <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">
        Congratulations — that is exactly what this platform is for.
      </p>

      <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">
        If she has already started, would you write a short review? It takes a minute,
        and it is the only thing future families have to go on when they are deciding
        whether to trust someone they have never met.
      </p>

      <div style="text-align:center;margin:0 0 24px;">
        <a href="${dashboard}" style="display:inline-block;background:#006a62;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;">
          Rate ${esc(helper)}
        </a>
      </div>

      <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
        Open your conversation with ${esc(helper)} and the rating box is right there in the chat.
        If she has not actually worked for you, just ignore this email — nothing happens,
        and we will not ask again.
      </p>

      <p style="font-size:14px;color:#666;margin:24px 0 0;">Jelena<br>thaihelper.app</p>
    </div>
    ${unsubscribeUrl ? `<p style="text-align:center;font-size:12px;color:#9ca3af;margin:20px 0 0;">
      <a href="${unsubscribeUrl}" style="color:#9ca3af;">Stop these emails</a>
    </p>` : ''}
  </div>
</body></html>`;

  return resend.emails.send({
    from: FROM,
    to: employerEmail,
    replyTo: ADMIN_EMAIL,
    subject: `${helper} says you hired her — would you review her?`,
    text,
    html,
  });
}
