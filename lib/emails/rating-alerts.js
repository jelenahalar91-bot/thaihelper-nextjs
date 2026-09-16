/**
 * Admin alerts about reviews — the safety net that lets a single review be
 * public at all.
 *
 * Until 2026-09-16 a helper's reviews stayed hidden until the third one
 * arrived, which meant a false accusation cost nothing to sit on: it was
 * invisible anyway. Publishing from review #1 removes that grace period, so
 * the platform has to notice a bad review as fast as the public does. Two
 * triggers, both admin-only:
 *
 *   - sendRatingDisputeAlert  — a helper pressed "this review is not true".
 *   - sendLowRatingAlert      — a 1 or 2 star review landed at all, disputed
 *                               or not. Most will be legitimate; reading a
 *                               handful of honest bad reviews is the price of
 *                               catching the one that is revenge.
 *
 * Neither email goes to a helper or a family. Nothing here notifies anyone
 * but the admin.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@thaihelper.app';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

/**
 * A helper says a review about them is false.
 *
 * The review is still live when this sends — see scripts/supabase-rating-
 * disputes.sql for why disputing does not hide it. Speed is the whole point
 * of the mail, so it leads with what has to be decided.
 */
export async function sendRatingDisputeAlert({
  helperRef, helperName, employerRef, employerName, ratingStars, comment, reason,
}) {
  const subject = `⚠️ Review disputed: ${helperName || helperRef} (${ratingStars}★ from ${employerName || employerRef})`;

  const text = `${helperName || helperRef} (${helperRef}) disputes a review.

Review: ${ratingStars} of 5, by ${employerName || employerRef} (${employerRef})
${comment ? `"${comment}"\n` : ''}
Their reason:
${reason || '(none given)'}

The review is still visible on their profile. To remove it:

  delete from helper_ratings
  where helper_ref = '${helperRef}' and employer_ref = '${employerRef}';

To check whether these two really worked together, look at the conversation
between ${helperRef} and ${employerRef} — length and span are what the
eligibility rule measured, not whether a job happened.
`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size:20px;font-weight:700;color:#c0392b;margin:0 0 6px;">Review disputed</h1>
      <p style="font-size:14px;color:#666;margin:0 0 20px;">
        ${esc(helperName || helperRef)} (${esc(helperRef)}) says this review is not true.
      </p>

      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:20px;">
        <div style="font-size:20px;color:#F4A261;letter-spacing:2px;">${stars(ratingStars)}</div>
        <div style="font-size:13px;color:#666;margin-top:4px;">
          by ${esc(employerName || employerRef)} · ${esc(employerRef)}
        </div>
        ${comment ? `<blockquote style="margin:12px 0 0;padding:10px 14px;border-left:3px solid #e5e7eb;background:#ffffff;border-radius:8px;font-size:14px;color:#374151;">${esc(comment)}</blockquote>` : ''}
      </div>

      <div style="border-left:4px solid #c0392b;background:#fff4f4;padding:14px 16px;border-radius:8px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#c0392b;">Their reason</p>
        <p style="margin:0;font-size:14px;color:#7a2e2e;line-height:1.6;white-space:pre-wrap;">${esc(reason || '(none given)')}</p>
      </div>

      <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 10px;">
        The review is <strong>still visible</strong> on their profile. To remove it:
      </p>
      <pre style="background:#1a1a1a;color:#e5e7eb;padding:12px 14px;border-radius:8px;font-size:12px;overflow-x:auto;margin:0;">delete from helper_ratings
where helper_ref = '${esc(helperRef)}' and employer_ref = '${esc(employerRef)}';</pre>
    </div>
  </div>
</body></html>`;

  return resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject, text, html });
}

/**
 * A 1 or 2 star review arrived. Informational — no action implied.
 */
export async function sendLowRatingAlert({
  helperRef, helperName, employerRef, employerName, ratingStars, comment, totalReviews,
}) {
  const subject = `${ratingStars}★ review for ${helperName || helperRef} from ${employerName || employerRef}`;

  const context = totalReviews <= 1
    ? 'This is their only review, so it is their entire public rating right now.'
    : `They now have ${totalReviews} reviews.`;

  const text = `${employerName || employerRef} (${employerRef}) rated ${helperName || helperRef} (${helperRef}) ${ratingStars} of 5.

${comment ? `"${comment}"\n\n` : ''}${context}

The helper has been emailed and can dispute it in one click. Nothing needs
doing unless they do, or unless this looks like the EMP-572KZV pattern:
a new account, a short exchange, a serious accusation.
`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size:19px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">${ratingStars}-star review</h1>
      <div style="font-size:20px;color:#F4A261;letter-spacing:2px;margin-bottom:12px;">${stars(ratingStars)}</div>
      <p style="font-size:14px;color:#666;margin:0 0 16px;">
        ${esc(employerName || employerRef)} (${esc(employerRef)}) → ${esc(helperName || helperRef)} (${esc(helperRef)})
      </p>
      ${comment ? `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #e5e7eb;background:#f9fafb;border-radius:8px;font-size:14px;color:#374151;">${esc(comment)}</blockquote>` : ''}
      <p style="font-size:13px;color:#666;line-height:1.6;margin:0;">${esc(context)}</p>
      <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:14px 0 0;">
        The helper has been emailed and can dispute it in one click. Nothing needs doing
        unless they do, or unless this looks like the EMP-572KZV pattern: a new account,
        a short exchange, a serious accusation.
      </p>
    </div>
  </div>
</body></html>`;

  return resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject, text, html });
}
