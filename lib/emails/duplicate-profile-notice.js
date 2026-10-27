/**
 * Tell a family that the profile they wrote to was a duplicate — October 2026.
 *
 * Three helpers had registered twice (TH-F21CBP, TH-TUWYMU, TH-BNOIJS). The
 * usual cause: the verification mail is not found, so the person signs up
 * again, and from then on only opens the newer account. The abandoned profile
 * stays listed and keeps taking messages nobody reads.
 *
 * From the family's side that is invisible and actively misleading. Sean had
 * been arranging a video call with Thapach on her live profile on 18 October,
 * and the next day wrote "Hi Thapach, I saw your profile and am interested" to
 * her dead one — he believed he had found a second nanny. Two other families
 * favourited both of her cards within a minute of each other.
 *
 * So this mail has one job: say that the silence was not a rejection. A family
 * who writes and hears nothing concludes the helper is not interested, and the
 * helper never knew they existed. Which profile to use next is the second
 * point, not the first.
 *
 * WHAT IT MUST NOT DO is imply the helper did anything wrong. She registered
 * twice on a website; that is our registration flow's problem, not a character
 * flaw, and these women are the product. No apology on her behalf, no
 * explanation of her email habits — the subject is the listing, not her.
 *
 * `liveProfileUrl` is omitted when the family has no live thread with her: a
 * link into a conversation that does not exist yet is an invitation to start
 * one, which is fine, but phrasing it as "continue there" would be a lie.
 *
 * English only. Every family reached by this is on preferred_language 'en';
 * add a Thai half (pattern: scam-warning.js) before sending to a Thai family.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>';
const SUPPORT = 'support@thaihelper.app';

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[c]));

export function buildDuplicateProfileNotice({ firstName, helperName, hasLiveThread, messageCount = 1 }) {
  const name = firstName || 'there';
  const helper = helperName || 'the helper';

  const subject = `About the profile you messaged — ${helper} has only one account`;

  // One unanswered message reads as "she is not interested". Five reads as
  // "this platform is dead". They need different first sentences.
  const opening = messageCount > 1
    ? `You have written ${messageCount} times to ${helper} without an answer. That was not a rejection — the profile you were writing to is not one she opens.`
    : `You wrote to ${helper} and had no reply. That was not a rejection — the profile you were writing to is not one she opens.`;

  const next = hasLiveThread
    ? `She has a second profile, and that is the one she uses. You are already in a conversation with her there — that thread is the one to follow up in.`
    : `She has a second profile, and that is the one she uses. You can message her there and she will see it.`;

  const text = `Hi ${name},

${opening}

She registered twice by mistake — a duplicate account, most likely because a verification email went missing the first time. Both profiles were listed, and there was no way for you to tell them apart. That is our fault, not hers.

${next}

We have now taken the duplicate off the site, so nobody else writes into it. Your earlier messages are not lost, but she will not see them there — worth repeating anything important.

Sorry for the detour.

Jelena
Founder, thaihelper.app
${SUPPORT}`;

  const p = 'style="margin:0 0 14px;"';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;line-height:1.65;color:#222;">
<div style="max-width:540px;margin:32px auto;padding:0 18px;">
  <div style="background:#fff;border-radius:14px;padding:28px;border-top:4px solid #F4A261;">

    <p ${p}>Hi ${esc(name)},</p>

    <div style="background:#fdf1e3;border-left:3px solid #F4A261;padding:14px 18px;border-radius:8px;margin:0 0 16px;">
      <strong>${esc(opening)}</strong>
    </div>

    <p ${p}>She registered twice by mistake — a duplicate account, most likely because a verification email went missing the first time. Both profiles were listed, and there was no way for you to tell them apart. That is our fault, not hers.</p>
    <p ${p}>${esc(next)}</p>
    <p ${p}>We have now taken the duplicate off the site, so nobody else writes into it. Your earlier messages are not lost, but she will not see them there — worth repeating anything important.</p>
    <p ${p}>Sorry for the detour.</p>
    <p style="margin:0;">Jelena<br><span style="color:#666;font-size:14px;">Founder, thaihelper.app · <a href="mailto:${SUPPORT}" style="color:#006a62;">${SUPPORT}</a></span></p>

  </div>
</div>
</body></html>`;

  return { subject, text, html };
}

export async function sendDuplicateProfileNotice({ firstName, email, helperName, hasLiveThread, messageCount }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, text, html } = buildDuplicateProfileNotice({ firstName, helperName, hasLiveThread, messageCount });
  // Text part always included — see the SPF/DKIM/DMARC notes.
  return resend.emails.send({ from: FROM, to: email, subject, text, html });
}
