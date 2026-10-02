// POST /api/employer-signup
// Create a full employer account (not just a lead). Returns the employer_ref
// so the client can show it immediately. Sends a confirmation email with the
// ref so the employer can log in later.

import crypto from 'crypto';
import { getServiceSupabase } from '../../lib/supabase';
import { impersonationBlock, impersonationNotes, IMPERSONATION_ERROR } from '../../lib/impersonation';
import { createToken, setSessionCookie } from '../../lib/auth';
import {
  sendEmployerAccountConfirmation,
  sendAdminNotification,
} from '../../lib/send-confirmation-email';
import { verifyTurnstile } from '../../lib/turnstile';
import { formatAttributionString } from '../../lib/utm';
import { translateForeignText } from '../../lib/translate';
import { looksLikeFullAddress } from '../../lib/address-guard';
import { buildJobDetailsPatch, missingJobTexts, MIN_TEXT_LENGTH } from '../../lib/employer-job-details';
import { readPhoneProof } from '../../lib/phone-signup-token';
import { signupNeedsPhone } from '../../lib/access';
import { numberTakenBy } from '../../lib/phone-identity';
import { registrationResemblance } from '../../lib/spam-signals';
import { VALID_CITY_SLUGS, toCitySlug } from '../../lib/constants/cities';

function generateRef() {
  // crypto.randomBytes is cryptographically secure — Math.random() is
  // not. The employer_ref is effectively a second auth factor alongside
  // the email, so a guessable ref weakens authentication directly.
  return 'EMP-' + crypto.randomBytes(8).toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, 6)
    .toUpperCase();
}

// Promo access during the launch phase:
// When PROMO_ACTIVE=true (env var), every new employer account automatically
// gets free access to contact info for PROMO_DAYS days (default 56 = 8 weeks).
// After the promo period ends, set PROMO_ACTIVE=false and employers will sign
// up on the free tier and need to upgrade to see WhatsApp / phone numbers.
function getPromoAccess() {
  const active = process.env.PROMO_ACTIVE === 'true';
  if (!active) return { access_until: null, access_tier: 'free' };

  const days = parseInt(process.env.PROMO_DAYS || '56', 10);
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return {
    access_until: expires.toISOString(),
    access_tier: 'promo',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    city,
    area,
    lookingFor,
    neededSkills,
    scheduleDays,
    scheduleTime,
    duration,
    childAgeGroups,
    arrangementPreference,
    startTiming,
    preferredAgeRange,
    jobDescription,
    jobDetails,
    preferredLanguage,
    turnstileToken,
    phoneToken,
    attribution,
  } = req.body || {};

  // Verify Turnstile CAPTCHA
  const captcha = await verifyTurnstile(turnstileToken);
  if (!captcha.success) {
    return res.status(403).json({ error: captcha.error });
  }

  // Whitelist the arrangement preference — must match the CHECK constraint
  const ARRANGEMENT_VALUES = ['live_in', 'live_out', 'either'];
  const safeArrangement = ARRANGEMENT_VALUES.includes(arrangementPreference)
    ? arrangementPreference
    : null;

  // Whitelist start timing — must match the CHECK constraint (see
  // scripts/supabase-employer-start-timing.sql).
  const START_TIMING_VALUES = ['immediate', 'within_2_weeks', 'within_1_month', 'flexible'];
  const safeStartTiming = START_TIMING_VALUES.includes(startTiming)
    ? startTiming
    : null;

  // Validate required fields
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !city) {
    return res.status(400).json({
      error: 'First name, last name, email and city are required.',
    });
  }

  // A family that names no role is not looking for anyone.
  //
  // This was optional, and the two accounts that left it empty and then
  // messaged helpers are both suspended today: EMP-6J3VUE (the "Support
  // ThaiHelper" phishing run) and one earlier scam family. Measured over all
  // 189 families: 4 of the 178 who said what they wanted are suspended (2.2%),
  // against 2 of the 11 who said nothing (18%) — eight times the rate.
  //
  // It is also the field the whole product turns on. Without it a listing
  // shows a name and a city, matching cannot place them, and a helper reading
  // the profile learns nothing. Requiring it costs an honest family one tap on
  // a chip they meant to tap anyway.
  const wantedRoles = Array.isArray(lookingFor)
    ? lookingFor.filter((v) => typeof v === 'string' && v.trim())
    : String(lookingFor || '').split(',').map((v) => v.trim()).filter(Boolean);
  if (wantedRoles.length === 0) {
    return res.status(400).json({ error: 'looking_for_required' });
  }

  // Every role the family ticked needs a description of that job.
  //
  // Optional until 2026-10-02, and 25 of the 46 families who registered in the
  // two weeks before were listed with no text at all: a name, a city, and
  // nothing a helper could answer. 30% of them never received a single reply,
  // against 15% of the families who wrote one. Requiring looking_for (2026-09-28)
  // fixed what a listing is FILED under; this fixes whether it SAYS anything.
  //
  // Per role, not one box for all of them, because the multi-job form already
  // works that way (2026-08-25) — a family wanting a nanny and a housekeeper is
  // describing two jobs, and the reply each one needs is different.
  //
  // The returned list names the roles still missing, so the form can point at
  // the empty box rather than saying "something is wrong".
  const missingTexts = missingJobTexts(jobDetails, wantedRoles);
  if (missingTexts.length) {
    return res.status(400).json({
      error: 'job_text_required',
      categories: missingTexts,
      minLength: MIN_TEXT_LENGTH,
    });
  }

  // "Support ThaiHelper" registered here on 2026-09-27 and phished nine
  // helpers with it. See lib/impersonation.js.
  const impersonation = impersonationBlock({ firstName, lastName });
  if (impersonation) {
    console.warn(`[employer-signup] refused impersonating name: ${impersonation.field}="${impersonation.value}" (${impersonation.reason})`);
    return res.status(400).json({ error: IMPERSONATION_ERROR, field: impersonation.field });
  }

  // City must be a real Thailand location, stored as a slug — the same gate
  // /api/register applies to helpers. The two sides used to disagree here:
  // this form submitted display names ("Phuket") while helpers submitted
  // slugs ("phuket"), so every city comparison across the two tables failed.
  const citySlug = toCitySlug(city);
  if (!VALID_CITY_SLUGS.has(citySlug)) {
    return res.status(400).json({ error: 'Please choose a valid city in Thailand.' });
  }

  // "Area" is shown publicly and unauthenticated on /employers-browse cards
  // — reject full street addresses (house number + moo/soi) here rather
  // than storing them, since that's an exact-home-location leak, not a
  // neighbourhood name.
  if (looksLikeFullAddress(area)) {
    return res.status(400).json({ error: 'area_full_address' });
  }

  // Per-category job descriptions ({ nanny: "text", … }) — sanitised,
  // translated and flattened into the legacy job_description pair by
  // buildJobDetailsPatch. Preferred over the single jobDescription below.
  const jobDetailsPatch = await buildJobDetailsPatch(jobDetails);
  const hasJobDetails = !!jobDetailsPatch?.job_details;

  // Sanitize job description: strip phone numbers and emails for privacy
  const sanitizedJobDesc = (jobDescription || '')
    .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[phone hidden]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email hidden]');

  // Store an English translation alongside the original so English-reading
  // helpers can read Thai job posts (mirrors helper bio_en). Returns null
  // when the text is already English or the Translate API is unavailable —
  // the UI then falls back to the original. Skipped when per-category
  // texts were sent — they carry their own translations.
  const jobDescriptionEn = hasJobDetails ? null : await translateForeignText(sanitizedJobDesc);

  const supabase = getServiceSupabase();

  // A verified phone number, or no account.
  //
  // The proof is minted by /api/phone/signup-verify-otp after Twilio approves a
  // code, and it names the number it was minted for — see
  // lib/phone-signup-token.js for why a token rather than a session.
  //
  // Checked here and not in the form alone, because the form is not the only
  // way to reach this endpoint.
  let verifiedPhone = null;
  if (signupNeedsPhone()) {
    const proof = await readPhoneProof(phoneToken);
    if (!proof) {
      return res.status(400).json({ error: 'phone_not_verified' });
    }

    // The third and final ownership check. signup-send-otp asked before paying
    // for the SMS and signup-verify-otp asked before minting the proof; a proof
    // is good for 30 minutes, so the number can be claimed inside that window.
    // This is the one that runs immediately before the row is written, and it is
    // the only one that cannot be raced.
    const owner = await numberTakenBy(supabase, proof.phone, null);
    if (owner.taken) {
      console.warn(`[employer-signup] refused: number already held by ${owner.ref}`);
      return res.status(409).json({
        error: owner.suspended ? 'phone_blocked' : 'phone_in_use',
      });
    }
    verifiedPhone = proof;
  }

  const ref = generateRef();
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const promo = getPromoAccess();

  try {
    const { data: inserted, error: insertError } = await supabase
      .from('employer_accounts')
      .insert({
        employer_ref: ref,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        // The verified number goes in its own columns; `phone` above stays the
        // free-text field the form has always had, which nothing trusts.
        phone_number: verifiedPhone?.phone || null,
        phone_country_code: verifiedPhone?.countryCode || null,
        phone_verified_at: verifiedPhone ? new Date().toISOString() : null,
        phone_verified_channel: verifiedPhone ? 'sms' : null,
        city: citySlug,
        area: area?.trim() || null,
        looking_for: Array.isArray(lookingFor) ? lookingFor.join(', ') : (lookingFor || null),
        needed_skills: Array.isArray(neededSkills) ? (neededSkills.join(', ') || null) : (neededSkills || null),
        schedule_days: Array.isArray(scheduleDays) ? (scheduleDays.join(', ') || null) : (scheduleDays || null),
        schedule_time: Array.isArray(scheduleTime) ? (scheduleTime.join(', ') || null) : (scheduleTime || null),
        duration: duration || null,
        child_age_groups: Array.isArray(childAgeGroups) ? (childAgeGroups.join(', ') || null) : (childAgeGroups || null),
        arrangement_preference: safeArrangement,
        start_timing: safeStartTiming,
        preferred_age_range: preferredAgeRange || null,
        job_description: hasJobDetails ? jobDetailsPatch.job_description : (sanitizedJobDesc || null),
        job_description_en: hasJobDetails ? jobDetailsPatch.job_description_en : (jobDescriptionEn || null),
        job_details: hasJobDetails ? jobDetailsPatch.job_details : null,
        preferred_language: preferredLanguage || 'en',
        access_until: promo.access_until,
        access_tier: promo.access_tier,
        source: formatAttributionString(attribution),
        email_verified: false,
        verification_token: verificationToken,
        // Someone actively filling out this form IS an activity moment —
        // without this, "Recently active" on /employers-browse showed
        // NULL for every fresh signup (confirmed 2026-07-14: all 10 most
        // recent employer registrations, down to 7h old, had
        // last_login_at = NULL) because the post-signup success screen
        // is rendered from the signup response itself and never makes a
        // follow-up authenticated request — lib/auth.js's session-touch
        // fix (same commit history) only fires on THAT, so it never got
        // a chance to run for brand-new accounts.
        last_login_at: new Date().toISOString(),
      })
      // created_at feeds registrationResemblance below — without it the
      // "registered N minutes after a suspension" line has no clock.
      .select('employer_ref, first_name, email, city, access_until, access_tier, created_at')
      .single();

    if (insertError) {
      // Duplicate email (unique constraint violation)
      if (insertError.code === '23505' && insertError.message.includes('email')) {
        return res.status(409).json({ error: 'duplicate_email' });
      }
      console.error('Employer signup insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save registration' });
    }

    // Auto-login: create session immediately so the user lands on their
    // dashboard after signup (UX identical to a typical signup flow).
    const token = await createToken({
      ref: inserted.employer_ref,
      email: inserted.email,
      firstName: inserted.first_name,
      role: 'employer',
    });
    setSessionCookie(res, token, 'employer');

    // Send confirmation email (non-blocking — don't fail signup if email fails)
    try {
      if (process.env.RESEND_API_KEY) {
        const helperTypes = Array.isArray(lookingFor) ? lookingFor.join(', ') : (lookingFor || '');
        const warnings = await registrationResemblance(supabase, {
          employerRef: inserted.employer_ref,
          lookingFor: helperTypes,
          createdAt: inserted.created_at,
        }).catch((e) => {
          console.error('Resemblance check failed:', e.message);
          return [];
        });
        // A name that merely contains a role word is not refused (that happens
        // above, for the narrow cases), but the admin mail should say so rather
        // than looking like the twenty harmless signups before it — which is
        // exactly how "Support ThaiHelper" went unread for 21 hours.
        warnings.push(...impersonationNotes({ firstName, lastName }));
        await Promise.all([
          sendEmployerAccountConfirmation({
            firstName: inserted.first_name,
            email: inserted.email,
            ref: inserted.employer_ref,
            city: inserted.city,
            verificationToken,
          }),
          sendAdminNotification({
            type: 'employer',
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            city,
            area: (area || '').trim(),
            helperTypes,
            ref: inserted.employer_ref,
            warnings,
          }),
        ]);
      }
    } catch (emailErr) {
      console.error('Failed to send employer confirmation email:', emailErr);
    }

    return res.status(200).json({
      success: true,
      ref: inserted.employer_ref,
      firstName: inserted.first_name,
      accessUntil: inserted.access_until,
      accessTier: inserted.access_tier,
    });
  } catch (err) {
    console.error('Failed to create employer account:', err);
    return res.status(500).json({ error: 'Failed to create account' });
  }
}
