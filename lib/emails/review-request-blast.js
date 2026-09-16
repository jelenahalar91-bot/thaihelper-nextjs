/**
 * "Did it lead to a job?" — one-off blast to families who are eligible to
 * review a helper, September 2026.
 *
 * Context: reviews became visible from the first one on 2026-09-16 (see
 * lib/rating-visibility.js). Three reviews exist in total. The people who
 * could write the next ones are a small, known group — families who have had
 * a real back-and-forth with a helper (three messages each way over at least
 * a day, the same bar /api/ratings enforces). 22 of them at the time of
 * writing.
 *
 * Deliberately NOT a marketing mail:
 *   - It asks a real question first ("did it work out?"), because the answer
 *     is worth more to us than the review, and because ~half of these
 *     conversations went nowhere and those families should not be told to
 *     go rate someone.
 *   - It says where the button is, since being unable to find it is the
 *     actual reason three months produced three reviews.
 *   - It does not mention Trustpilot. That is a separate ask with a separate
 *     audience, and stacking both in one mail gets neither.
 *
 * Nothing here sends by itself. scripts/send-review-request-blast.js is
 * dry-run by default and needs --live.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@thaihelper.app';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const DASHBOARD = 'https://www.thaihelper.app/employer-dashboard';

/**
 * @param {object} p
 * @param {string} p.firstName
 * @param {string} p.email
 * @param {string[]} p.helperNames  - first names of the helpers they may rate
 * @param {string} p.unsubscribeUrl
 */
export async function sendReviewRequestEmail({
  firstName, email, helperNames = [], unsubscribeUrl,
}) {
  const name = firstName || 'there';

  // Naming the actual person is the whole difference between "leave a
  // review" and "how did it go with Pattama?". With several, we name them;
  // with none (should not happen), the mail still reads correctly.
  const names = helperNames.filter(Boolean);
  const who = names.length === 0
    ? 'the helper you were talking to'
    : names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

  const subject = names.length === 1
    ? `Did it work out with ${names[0]}?`
    : 'Did you find someone through ThaiHelper?';

  const text = `Hi ${name},

I can see you had a real conversation on ThaiHelper with ${who} — not just a
"hello", an actual back-and-forth.

I am writing to ask one thing: did it lead to a job?

If yes, would you leave a short review? Open your conversation and the star
box now sits right there under the messages — you no longer have to hunt for
it, which honestly was the problem until this week:
${DASHBOARD}

It matters more than it sounds. Most helpers here have no reviews at all, so
a family looking at them has nothing to go on except a photo and a few lines
of text. One honest sentence from you changes that for the person you talked
to.

If it did not work out, I would still like to know why — just reply to this
email. Wrong city, no answer, salary too far apart, something about the site
itself. We read every reply.

Thank you,
Jelena
Founder, thaihelper.app
${unsubscribeUrl ? `\nStop these emails: ${unsubscribeUrl}\n` : ''}`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 16px;">
        Did it lead to a job?
      </h1>

      <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 16px;">
        Hi ${esc(name)}, I can see you had a real conversation on ThaiHelper with
        <strong>${esc(who)}</strong> — not just a &ldquo;hello&rdquo;, an actual back-and-forth.
      </p>

      <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">
        If it worked out, would you leave a short review? Open your conversation and the
        star box now sits right there under the messages — you no longer have to hunt for
        it, which honestly was the problem until this week.
      </p>

      <div style="text-align:center;margin:0 0 24px;">
        <a href="${DASHBOARD}" style="display:inline-block;background:#006a62;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;">
          Open my conversations
        </a>
      </div>

      <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 16px;">
        It matters more than it sounds. Most helpers here have no reviews at all, so a
        family looking at them has nothing to go on except a photo and a few lines of text.
        One honest sentence from you changes that for the person you talked to.
      </p>

      <p style="font-size:15px;color:#444;line-height:1.7;margin:0;">
        If it did not work out, I would still like to know why — just reply to this email.
        Wrong city, no answer, salary too far apart, something about the site itself.
        We read every reply.
      </p>

      <p style="font-size:14px;color:#666;margin:24px 0 0;">
        Thank you,<br>Jelena<br>Founder, thaihelper.app
      </p>
    </div>
    ${unsubscribeUrl ? `<p style="text-align:center;font-size:12px;color:#9ca3af;margin:20px 0 0;">
      <a href="${unsubscribeUrl}" style="color:#9ca3af;">Stop these emails</a>
    </p>` : ''}
  </div>
</body></html>`;

  return resend.emails.send({
    from: FROM,
    to: email,
    replyTo: ADMIN_EMAIL,
    subject,
    text,
    html,
  });
}
