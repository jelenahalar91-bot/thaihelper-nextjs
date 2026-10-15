// The two follow-up emails a family can get after signing up.
//
// Both run once a day from pages/api/cron/message-reminders.js, and BOTH ARE
// OFF until FAMILY_FOLLOWUPS_LIVE=true is set in the environment.
//
// Without the flag each function still does all of its work — every query,
// every per-family check — and returns `would`: exactly who it would have
// written to and what the mail would have contained. So the nightly cron is
// its own dry run, and the preview is simply yesterday's cron response. Set
// the flag when you have read one and want it to go out; sending to real
// families is a decision somebody makes on purpose, not something a deploy
// does.
//
//   1. Agency suggestions — once, ~18 days after signup, only to families
//      who ticked the box at registration. lib/emails/agency-suggestions.js
//   2. "Are you still looking?" — at most three times, 30 days apart, only
//      to families still marked 'searching' who have not logged in for two
//      weeks. lib/emails/status-checkin.js
//
// Shared rules: a suspended or closed account is never written to, nor is
// one that turned notifications off, nor one that has already told us it
// hired someone. Every mail carries one-click unsubscribe.

import { isPubliclyListable } from './access';
import { toCitySlug, formatCity, CITY_OPTIONS } from './constants/cities';
import { createUnsubscribeToken, buildUnsubscribeUrl } from './unsubscribe';
import { createFollowupToken, buildFollowupUrl, FOLLOWUP_ANSWERS } from './family-followup-token';
import { sendAgencySuggestionsEmail } from './emails/agency-suggestions';
import { sendStatusCheckinEmail } from './emails/status-checkin';
import { normalizePricing } from './directory-pricing';

// ─── Timing ───────────────────────────────────────────────────────────────
//
// 18 days for the agency mail: long enough that someone who was going to
// find a helper here mostly has (of the pairs that reach a real exchange,
// almost all start inside the first fortnight), short enough to still be
// useful to someone who has given up. "Two to three weeks" in round numbers.
const AGENCY_REFERRAL_AFTER_DAYS = 18;

// The check-in deliberately waits a month and then only writes to people who
// are not here: 23 of the 131 stale 'searching' accounts had logged in
// within two weeks on 2026-10-14, and those 23 do not need an email telling
// them what their own dashboard shows.
const CHECKIN_MIN_AGE_DAYS = 28;
const CHECKIN_QUIET_DAYS = 14;
const CHECKIN_INTERVAL_DAYS = 30;
// Three unanswered check-ins is the whole series. After that the account is
// left alone for good — silence is an answer too, and the dashboard's own
// prompt is still there if they ever come back.
const MAX_CHECKINS = 3;

// Keep one cron run bounded, same reasoning as the message reminders.
const MAX_AGENCY_MAILS_PER_RUN = 25;
const MAX_CHECKINS_PER_RUN = 40;

// How many agencies one email names before "see all".
const AGENCIES_PER_EMAIL = 4;

const VALID_CITY_SLUGS = new Set(CITY_OPTIONS.map(c => c.slug));

export function followupsAreLive() {
  return process.env.FAMILY_FOLLOWUPS_LIVE === 'true';
}

const daysAgo = (n) => new Date(Date.now() - n * 86400 * 1000).toISOString();

/** Has this family already told us, anywhere, that the search ended? */
async function searchAlreadyEnded(supabase, employerRef) {
  const [{ data: hire }, { data: outcome }] = await Promise.all([
    supabase
      .from('hire_confirmations')
      .select('id')
      .eq('employer_ref', employerRef)
      .limit(1),
    supabase
      .from('hiring_outcomes')
      .select('outcome')
      .eq('employer_ref', employerRef)
      .in('outcome', ['hired_here', 'hired_elsewhere', 'stopped_looking'])
      .limit(1),
  ]);
  return !!(hire && hire.length) || !!(outcome && outcome.length);
}

/**
 * Agencies and service companies that serve this city AND publish prices.
 * An email that says "here are agencies" and then shows no fees is the one
 * thing this mail must never be — the fees are the reason to send it.
 */
async function agenciesForCity(supabase, citySlug, cache) {
  if (cache.has(citySlug)) return cache.get(citySlug);

  const { data } = await supabase
    .from('directory_listings')
    .select('slug, name, city, cities_served, type, tier, pricing, payment_flow')
    .eq('status', 'active')
    .in('type', ['agency', 'service_company'])
    .not('pricing', 'is', null);

  const serves = (row) => {
    if (toCitySlug(row.city) === citySlug) return true;
    return String(row.cities_served || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .includes(citySlug);
  };

  const TIER_RANK = { featured: 3, premium: 2, free: 1 };
  const listings = (data || [])
    .filter(serves)
    .map(row => ({
      slug: row.slug,
      name: row.name,
      type: row.type,
      tier: row.tier || 'free',
      pricing: normalizePricing(row.pricing),
      paymentFlow: row.payment_flow || '',
    }))
    .filter(l => l.pricing.length > 0)
    .sort((a, b) => (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0) || a.name.localeCompare(b.name))
    .slice(0, AGENCIES_PER_EMAIL);

  cache.set(citySlug, listings);
  return listings;
}

// ─── 1. Agency suggestions ────────────────────────────────────────────────

export async function runAgencyReferrals(supabase, { live = followupsAreLive(), limit = MAX_AGENCY_MAILS_PER_RUN } = {}) {
  const result = { live, candidates: 0, sent: 0, skipped: 0, failed: 0, would: [] };

  const { data: rows, error } = await supabase
    .from('employer_accounts')
    .select('employer_ref, first_name, email, city, preferred_language, notify_on_message, status, search_status, created_at')
    .eq('agency_referral_opt_in', true)
    .is('agency_referral_sent_at', null)
    .eq('email_verified', true)
    .eq('search_status', 'searching')
    .lt('created_at', daysAgo(AGENCY_REFERRAL_AFTER_DAYS))
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Agency referral query error:', error);
    return { ...result, error: error.message };
  }

  const cityCache = new Map();

  for (const emp of rows || []) {
    result.candidates++;
    try {
      if (!emp.email || emp.notify_on_message === false || !isPubliclyListable(emp)) {
        result.skipped++;
        continue;
      }
      if (await searchAlreadyEnded(supabase, emp.employer_ref)) {
        result.skipped++;
        // Nothing more to say to them, and nothing to retry tomorrow either.
        if (live) await markAgencyReferralSent(supabase, emp.employer_ref);
        continue;
      }

      const citySlug = toCitySlug(emp.city);
      if (!citySlug || !VALID_CITY_SLUGS.has(citySlug)) { result.skipped++; continue; }

      const listings = await agenciesForCity(supabase, citySlug, cityCache);
      // No agency with published fees covers this city yet. Say nothing
      // rather than send a near-empty list, and leave the flag unset so they
      // get the mail once one is listed.
      if (listings.length === 0) { result.skipped++; continue; }

      result.would.push({
        ref: emp.employer_ref,
        city: citySlug,
        agencies: listings.map(l => l.name),
      });

      if (!live) continue;

      const unsubscribeUrl = buildUnsubscribeUrl(await createUnsubscribeToken('employer', emp.employer_ref));
      await sendAgencySuggestionsEmail({
        firstName: emp.first_name,
        email: emp.email,
        cityLabel: formatCity(citySlug),
        citySlug,
        listings,
        unsubscribeUrl,
        lang: emp.preferred_language === 'th' ? 'th' : 'en',
      });
      await markAgencyReferralSent(supabase, emp.employer_ref);
      result.sent++;
    } catch (err) {
      console.error('Agency referral failed for', emp.employer_ref, err.message);
      result.failed++;
      // No marking on failure — tomorrow's run tries again.
    }
  }

  return result;
}

async function markAgencyReferralSent(supabase, employerRef) {
  await supabase
    .from('employer_accounts')
    .update({ agency_referral_sent_at: new Date().toISOString() })
    .eq('employer_ref', employerRef);
}

// ─── 2. "Are you still looking?" ──────────────────────────────────────────

export async function runStatusCheckins(supabase, { live = followupsAreLive(), limit = MAX_CHECKINS_PER_RUN } = {}) {
  const result = { live, candidates: 0, sent: 0, skipped: 0, failed: 0, would: [] };

  const { data: rows, error } = await supabase
    .from('employer_accounts')
    .select('employer_ref, first_name, email, preferred_language, notify_on_message, status, created_at, last_login_at, status_checkin_sent_at, status_checkin_count')
    .eq('search_status', 'searching')
    .eq('email_verified', true)
    .lt('created_at', daysAgo(CHECKIN_MIN_AGE_DAYS))
    .lt('status_checkin_count', MAX_CHECKINS)
    .order('created_at', { ascending: true })
    .limit(limit * 3); // over-fetch: most rows fall out on the checks below

  if (error) {
    console.error('Status check-in query error:', error);
    return { ...result, error: error.message };
  }

  const quietBefore = Date.parse(daysAgo(CHECKIN_QUIET_DAYS));
  const intervalBefore = Date.parse(daysAgo(CHECKIN_INTERVAL_DAYS));

  for (const emp of rows || []) {
    if (result.candidates >= limit) break;
    try {
      if (!emp.email || emp.notify_on_message === false || !isPubliclyListable(emp)) continue;
      // Someone who logged in this fortnight can see their own status.
      if (emp.last_login_at && Date.parse(emp.last_login_at) > quietBefore) continue;
      // A month between check-ins, counted from the last one we sent.
      if (emp.status_checkin_sent_at && Date.parse(emp.status_checkin_sent_at) > intervalBefore) continue;

      result.candidates++;

      if (await searchAlreadyEnded(supabase, emp.employer_ref)) {
        result.skipped++;
        continue;
      }

      const weeks = Math.round((Date.now() - Date.parse(emp.created_at)) / (7 * 86400 * 1000));
      result.would.push({
        ref: emp.employer_ref,
        weeks,
        round: (emp.status_checkin_count || 0) + 1,
      });

      if (!live) continue;

      const token = await createFollowupToken(emp.employer_ref);
      const links = Object.fromEntries(FOLLOWUP_ANSWERS.map(a => [a, buildFollowupUrl(token, a)]));
      const unsubscribeUrl = buildUnsubscribeUrl(await createUnsubscribeToken('employer', emp.employer_ref));

      await sendStatusCheckinEmail({
        firstName: emp.first_name,
        email: emp.email,
        weeksSinceSignup: weeks,
        links,
        unsubscribeUrl,
        lang: emp.preferred_language === 'th' ? 'th' : 'en',
      });

      await supabase
        .from('employer_accounts')
        .update({
          status_checkin_sent_at: new Date().toISOString(),
          status_checkin_count: (emp.status_checkin_count || 0) + 1,
        })
        .eq('employer_ref', emp.employer_ref);
      result.sent++;
    } catch (err) {
      console.error('Status check-in failed for', emp.employer_ref, err.message);
      result.failed++;
    }
  }

  return result;
}
