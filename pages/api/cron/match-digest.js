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
  // Named after what the email CONTAINS, not who receives it — same
  // convention as sendNewHelperMatchEmail / sendNewEmployerMatchEmail:
  //   sendHelperMatchDigestEmail   → lists helpers,   goes to an employer
  //   sendEmployerMatchDigestEmail → lists employers, goes to a helper
  // Both bail out silently (return null) when handed the wrong list prop.
  sendHelperMatchDigestEmail,
  sendEmployerMatchDigestEmail,
} from '../../../lib/send-confirmation-email';
import { createUnsubscribeToken, buildUnsubscribeUrl } from '../../../lib/unsubscribe';
import { sendPush, templates as lineTemplates } from '../../../lib/line';
import {
  MATCH_COOLDOWN_DAYS,
  matchOverlap,
  fetchHelpersCoveringCity,
  helperCitySlugs,
} from '../../../lib/match-notifications';
import { toCitySlug, cityQueryVariants } from '../../../lib/constants/cities';

const COOLDOWN_MS = MATCH_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
// Cap how far back we look on the very first run for a recipient (NULL
// last_match_notification_at). We don't want to suddenly blast a digest of
// every helper/employer ever registered — keep the lookback bounded.
const FIRST_RUN_LOOKBACK_DAYS = 7;

// Bound a single cron run so it can't time out on a large backlog.
const MAX_RECIPIENTS_PER_RUN = 200;

// Cap the rows inside one digest email. The city query runs twice (home city
// + additional_cities) and each side is capped at 20, so an unbounded digest
// could list 40 people — too long to read and too easy to mistake for spam.
const MAX_ROWS_PER_DIGEST = 12;

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
      'search_status, line_user_id, notify_via_line, last_match_notification_at'
    )
    .eq('email_verified', true)
    .or(`last_match_notification_at.is.null,last_match_notification_at.lt.${cooldownCutoff}`)
    .limit(MAX_RECIPIENTS_PER_RUN);

  if (empErr) {
    console.error('Match digest: employer fetch error:', empErr);
  } else {
    for (const emp of empCandidates || []) {
      if (!emp.email && !emp.line_user_id) continue;
      // Respect paused/hidden — those employers opted out of new-match
      // alerts. NULL (pre-migration) counts as actively searching.
      if (emp.search_status === 'paused' || emp.search_status === 'hidden') continue;
      // 'other' / blank city can't be matched to anyone.
      const empCitySlug = toCitySlug(emp.city);
      if (!empCitySlug || empCitySlug === 'other') continue;
      const wanted = parseLookingFor(emp.looking_for);
      if (wanted.length === 0) continue;

      const since = newSinceCutoff(emp.last_match_notification_at);

      // Pull verified helpers who cover the employer's city — home city or
      // additional_cities — and verified after `since`. Category overlap is
      // resolved in JS (both sides store comma-joined lists).
      // Uses email_verified_at (not created_at) so a helper who registered
      // weeks ago but verified yesterday is still surfaced in the digest.
      const { data: helpers, error: hErr } = await fetchHelpersCoveringCity(
        supabase,
        emp.city,
        'helper_ref, first_name, city, category, additional_cities, email_verified, ' +
        'status, availability_status',
        { verifiedSince: since, limit: 20 }
      );

      if (hErr) {
        console.error(`Match digest: helpers fetch failed for emp ${emp.employer_ref}:`, hErr);
        continue;
      }

      const matches = (helpers || [])
        .filter((h) => h.status === null || h.status === undefined || h.status === 'active')
        .filter((h) => h.availability_status !== 'hidden')
        .map((h) => ({ helper: h, overlap: matchOverlap(emp, h) }))
        .filter((m) => m.overlap !== null)
        .slice(0, MAX_ROWS_PER_DIGEST);

      if (matches.length === 0) continue;

      let didNotify = false;

      // Email — gated by notify_on_message.
      if (emp.email && emp.notify_on_message !== false) {
        try {
          const token = await createUnsubscribeToken('employer', emp.employer_ref);
          const unsubscribeUrl = buildUnsubscribeUrl(token);
          await sendHelperMatchDigestEmail({
            recipientName: emp.first_name || '',
            recipientEmail: emp.email,
            helpers: matches.map(({ helper, overlap }) => ({
              firstName: helper.first_name || 'New helper',
              category: overlap.category,
              city: overlap.city,
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
      'helper_ref, first_name, email, city, category, additional_cities, notify_on_message, ' +
      'line_user_id, notify_via_line, last_match_notification_at, status, ' +
      'availability_status'
    )
    .eq('email_verified', true)
    .or(`last_match_notification_at.is.null,last_match_notification_at.lt.${cooldownCutoff}`)
    .or('status.eq.active,status.is.null')
    // Helpers who hid their profile don't want match mail at all.
    .or('availability_status.neq.hidden,availability_status.is.null')
    .limit(MAX_RECIPIENTS_PER_RUN);

  if (hlpErr) {
    console.error('Match digest: helper fetch error:', hlpErr);
  } else {
    for (const hlp of hlpCandidates || []) {
      if (!hlp.email && !hlp.line_user_id) continue;
      if (!hlp.category) continue;
      // Every city this helper covers — home plus "I can also travel to …".
      const coveredCities = helperCitySlugs(hlp);
      if (coveredCities.length === 0) continue;

      const since = newSinceCutoff(hlp.last_match_notification_at);

      // Pull verified employers in any city this helper covers, verified
      // after `since`. Category overlap is resolved in JS.
      // Uses email_verified_at (not created_at) so an employer who registered
      // earlier and only verified recently still appears in the digest.
      const { data: employers, error: eErr } = await supabase
        .from('employer_accounts')
        .select('employer_ref, first_name, city, looking_for, email_verified')
        .in('city', [...new Set(coveredCities.flatMap(cityQueryVariants))])
        .eq('email_verified', true)
        .gt('email_verified_at', since)
        .limit(20);

      if (eErr) {
        console.error(`Match digest: employers fetch failed for hlp ${hlp.helper_ref}:`, eErr);
        continue;
      }

      const matches = (employers || [])
        .map((e) => ({ employer: e, overlap: matchOverlap(e, hlp) }))
        .filter((m) => m.overlap !== null)
        .slice(0, MAX_ROWS_PER_DIGEST);

      if (matches.length === 0) continue;

      let didNotify = false;

      // Email — gated by notify_on_message.
      if (hlp.email && hlp.notify_on_message !== false) {
        try {
          const token = await createUnsubscribeToken('helper', hlp.helper_ref);
          const unsubscribeUrl = buildUnsubscribeUrl(token);
          await sendEmployerMatchDigestEmail({
            recipientName: hlp.first_name || '',
            recipientEmail: hlp.email,
            employers: matches.map(({ employer, overlap }) => ({
              firstName: employer.first_name || 'A new family',
              lookingForCategory: overlap.category,
              city: overlap.city,
            })),
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
