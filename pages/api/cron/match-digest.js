// GET /api/cron/match-digest
//
// Daily cron (configured in vercel.json) that sends a digest of accumulated
// matches to recipients whose immediate-match cooldown has expired.
//
// For each verified helper / employer with last_match_notification_at older
// than MATCH_COOLDOWN_DAYS (or NULL), we look at the opposite-side users in
// the same city + matching category whose email_verified happened SINCE the
// recipient's last notification. If there are any, we send a single digest
// email + optional LINE push, then stamp last_match_notification_at = now so
// the next 3-day window starts fresh.
//
// Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
// when CRON_SECRET is set. Falls back to `x-vercel-cron: 1` header otherwise.

import { getServiceSupabase } from '../../../lib/supabase';
import {
  sendHelperMatchDigestEmail,
  sendEmployerMatchDigestEmail,
} from '../../../lib/send-confirmation-email';
import { createUnsubscribeToken, buildUnsubscribeUrl } from '../../../lib/unsubscribe';
import { sendPush, templates as lineTemplates } from '../../../lib/line';
import { MATCH_COOLDOWN_DAYS } from '../../../lib/match-notifications';

const COOLDOWN_MS = MATCH_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
// Cap how far back we look on the very first run for a recipient (NULL
// last_match_notification_at). We don't want to suddenly blast a digest of
// every helper/employer ever registered — keep the lookback bounded.
const FIRST_RUN_LOOKBACK_DAYS = 7;

// Bound a single cron run so it can't time out on a large backlog.
const MAX_RECIPIENTS_PER_RUN = 200;

function authorize(req) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.authorization || '';
    return got === `Bearer ${expected}`;
  }
  // No secret configured — fail closed in production. The x-vercel-cron
  // header was previously trusted, but it's a regular HTTP header that
  // any client can send; Vercel doesn't strip it from public requests,
  // so it's not a real authentication signal. Allow only in development
  // (local cron testing without setting up the secret).
  if (process.env.NODE_ENV === 'production') {
    console.error('CRON_SECRET not set in production — refusing cron run');
    return false;
  }
  return req.headers['x-vercel-cron'] === '1';
}

function parseLookingFor(lookingFor) {
  if (!lookingFor) return [];
  return lookingFor
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Lower-bound timestamp for "what's new since you last heard from us".
// If recipient was never notified, fall back to the first-run lookback window.
function newSinceCutoff(lastNotifiedAt) {
  if (lastNotifiedAt) return new Date(lastNotifiedAt).toISOString();
  return new Date(Date.now() - FIRST_RUN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export default async function handler(req, res) {
  if (!authorize(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getServiceSupabase();
  const cooldownCutoff = new Date(Date.now() - COOLDOWN_MS).toISOString();

  let helperDigests = 0;
  let employerDigests = 0;
  let helperLineSent = 0;
  let employerLineSent = 0;

  // ─── EMPLOYER DIGESTS ────────────────────────────────────────────────────
  // Find verified employers whose cooldown is expired (or never sent), then
  // for each, find new helpers in the same city + matching looking_for since
  // the recipient's last notification.
  const { data: empCandidates, error: empErr } = await supabase
    .from('employer_accounts')
    .select(
      'employer_ref, first_name, email, city, looking_for, notify_on_message, ' +
      'line_user_id, notify_via_line, last_match_notification_at'
    )
    .eq('email_verified', true)
    .or(`last_match_notification_at.is.null,last_match_notification_at.lt.${cooldownCutoff}`)
    .neq('city', 'other')
    .limit(MAX_RECIPIENTS_PER_RUN);

  if (empErr) {
    console.error('Match digest: employer fetch error:', empErr);
  } else {
    for (const emp of empCandidates || []) {
      if (!emp.email && !emp.line_user_id) continue;
      const wanted = parseLookingFor(emp.looking_for);
      if (wanted.length === 0) continue;

      const since = newSinceCutoff(emp.last_match_notification_at);

      // Pull verified helpers in the same city verified after `since`.
      // Filter category in JS — small set, "multiple" wildcard is awkward in SQL.
      const { data: helpers, error: hErr } = await supabase
        .from('helper_profiles')
        .select('helper_ref, first_name, city, category, email_verified, status')
        .eq('city', emp.city)
        .eq('email_verified', true)
        .gt('created_at', since)
        .or('status.eq.active,status.is.null')
        .limit(20);

      if (hErr) {
        console.error(`Match digest: helpers fetch failed for emp ${emp.employer_ref}:`, hErr);
        continue;
      }

      const matches = (helpers || []).filter((h) => {
        if (!h.category) return false;
        if (h.category === 'multiple') return true;
        return wanted.includes(h.category);
      });

      if (matches.length === 0) continue;

      let didNotify = false;

      // Email — gated by notify_on_message.
      if (emp.email && emp.notify_on_message !== false) {
        try {
          const token = await createUnsubscribeToken('employer', emp.employer_ref);
          const unsubscribeUrl = buildUnsubscribeUrl(token);
          await sendEmployerMatchDigestEmail({
            recipientName: emp.first_name || '',
            recipientEmail: emp.email,
            helpers: matches.map((h) => ({
              firstName: h.first_name || 'New helper',
              category: h.category,
              city: h.city,
            })),
            unsubscribeUrl,
          });
          employerDigests++;
          didNotify = true;
        } catch (err) {
          console.error(`Match digest: email failed for emp ${emp.employer_ref}:`, err.message);
        }
      }

      // LINE push — gated by notify_via_line + linked account.
      if (emp.line_user_id && emp.notify_via_line === true) {
        try {
          const messages = lineTemplates.helperMatchDigest({
            count: matches.length,
            lang: 'both',
          });
          const r = await sendPush(emp.line_user_id, messages);
          if (r.ok) {
            employerLineSent++;
            didNotify = true;
          }
        } catch (err) {
          console.error(`Match digest: LINE failed for emp ${emp.employer_ref}:`, err.message);
        }
      }

      if (didNotify) {
        await supabase
          .from('employer_accounts')
          .update({ last_match_notification_at: new Date().toISOString() })
          .eq('employer_ref', emp.employer_ref);
      }
    }
  }

  // ─── HELPER DIGESTS ──────────────────────────────────────────────────────
  // Find verified helpers whose cooldown is expired (or never sent), then
  // for each, find new employers in the same city looking for the helper's
  // category since the recipient's last notification.
  const { data: hlpCandidates, error: hlpErr } = await supabase
    .from('helper_profiles')
    .select(
      'helper_ref, first_name, email, city, category, notify_on_message, ' +
      'line_user_id, notify_via_line, last_match_notification_at, status'
    )
    .eq('email_verified', true)
    .or(`last_match_notification_at.is.null,last_match_notification_at.lt.${cooldownCutoff}`)
    .neq('city', 'other')
    .or('status.eq.active,status.is.null')
    .limit(MAX_RECIPIENTS_PER_RUN);

  if (hlpErr) {
    console.error('Match digest: helper fetch error:', hlpErr);
  } else {
    for (const hlp of hlpCandidates || []) {
      if (!hlp.email && !hlp.line_user_id) continue;
      if (!hlp.category) continue;

      const since = newSinceCutoff(hlp.last_match_notification_at);

      // Pull verified employers in the same city verified after `since`.
      // Filter looking_for in JS so the "multiple" helper wildcard works.
      const { data: employers, error: eErr } = await supabase
        .from('employer_accounts')
        .select('employer_ref, first_name, city, looking_for, email_verified')
        .eq('city', hlp.city)
        .eq('email_verified', true)
        .gt('created_at', since)
        .limit(20);

      if (eErr) {
        console.error(`Match digest: employers fetch failed for hlp ${hlp.helper_ref}:`, eErr);
        continue;
      }

      const matches = (employers || []).filter((e) => {
        if (hlp.category === 'multiple') return true;
        const wanted = parseLookingFor(e.looking_for);
        return wanted.includes(hlp.category);
      });

      if (matches.length === 0) continue;

      let didNotify = false;

      // Email — gated by notify_on_message.
      if (hlp.email && hlp.notify_on_message !== false) {
        try {
          const token = await createUnsubscribeToken('helper', hlp.helper_ref);
          const unsubscribeUrl = buildUnsubscribeUrl(token);
          await sendHelperMatchDigestEmail({
            recipientName: hlp.first_name || '',
            recipientEmail: hlp.email,
            employers: matches.map((e) => {
              const wanted = parseLookingFor(e.looking_for);
              const display = wanted.includes(hlp.category) ? hlp.category : (wanted[0] || hlp.category);
              return {
                firstName: e.first_name || 'A new family',
                lookingForCategory: display,
                city: e.city,
              };
            }),
            unsubscribeUrl,
          });
          helperDigests++;
          didNotify = true;
        } catch (err) {
          console.error(`Match digest: email failed for hlp ${hlp.helper_ref}:`, err.message);
        }
      }

      // LINE push — gated by notify_via_line + linked account.
      if (hlp.line_user_id && hlp.notify_via_line === true) {
        try {
          const messages = lineTemplates.jobMatchDigest({
            count: matches.length,
            lang: 'both',
          });
          const r = await sendPush(hlp.line_user_id, messages);
          if (r.ok) {
            helperLineSent++;
            didNotify = true;
          }
        } catch (err) {
          console.error(`Match digest: LINE failed for hlp ${hlp.helper_ref}:`, err.message);
        }
      }

      if (didNotify) {
        await supabase
          .from('helper_profiles')
          .update({ last_match_notification_at: new Date().toISOString() })
          .eq('helper_ref', hlp.helper_ref);
      }
    }
  }

  return res.status(200).json({
    employerDigests,
    employerLineSent,
    helperDigests,
    helperLineSent,
  });
}
