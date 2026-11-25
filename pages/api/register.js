// POST /api/register
// Receives helper registration data, saves to Supabase, sends confirmation
// email, and signs the new helper in immediately so the client can upload a
// profile photo and land on /profile without a manual login step.

import crypto from 'crypto';
import { getServiceSupabase } from '../../lib/supabase';
import { impersonationBlock, impersonationNotes, IMPERSONATION_ERROR } from '../../lib/impersonation';
import { createToken, setSessionCookie } from '../../lib/auth';
import { sendHelperConfirmation, sendAdminNotification } from '../../lib/send-confirmation-email';
import { readPhoneProof } from '../../lib/phone-signup-token';
import { numberTakenBy } from '../../lib/phone-identity';
import { verifyTurnstile } from '../../lib/turnstile';
import { romanizeThaiName, translateForeignText } from '../../lib/translate';
import { formatAttributionString } from '../../lib/utm';
import {
  generateLinkToken as generateLineLinkToken,
  getAddFriendUrl as getLineAddFriendUrl,
} from '../../lib/line';
import { WP_STATUS_VALUES } from '../../lib/constants/work-permit';
import { NATIONALITY_VALUES, deriveWpStatusFromNationality } from '../../lib/constants/nationalities';
import { GENDER_VALUES } from '../../lib/constants/gender';
import { VALID_CITY_SLUGS } from '../../lib/constants/cities';
import { looksLikeFullAddress } from '../../lib/address-guard';
import { resolveAreaInput } from '../../lib/constants/areas';
import { validateDob } from '../../lib/age';

// LINE link tokens expire in 30 minutes — long enough to add the bot and
// send the link message, short enough to limit abuse.
const LINE_LINK_TTL_MS = 30 * 60 * 1000;

function generateRef() {
  // crypto.randomBytes is cryptographically secure — Math.random() is
  // not, and the helper_ref is effectively a second auth factor (email
  // + ref = login), so a guessable ref directly weakens authentication.
  // 6 bytes of base32-ish → ~10 chars of entropy after slicing to 6.
  return 'TH-' + crypto.randomBytes(8).toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, 6)
    .toUpperCase();
}

// Strip phone numbers and email addresses from free-text fields. Helpers
// shouldn't share contact info in their bio — communication happens via the
// on-platform messaging system. Mirrors the sanitizer in employer-signup.
function sanitizeFreeText(text) {
  return (text || '')
    .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[contact hidden]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[contact hidden]');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    first_name, last_name, date_of_birth, category, skills,
    city, area, area_other, additional_cities, experience, languages, rate,
    education, certificates, bio, email, phoneToken,
    notify_via_line, notify_via_whatsapp,
    work_permit_status, nationality, gender,
    turnstileToken, attribution,
  } = req.body || {};

  // Verify Turnstile CAPTCHA
  const captcha = await verifyTurnstile(turnstileToken);
  if (!captcha.success) {
    return res.status(403).json({ error: captcha.error });
  }

  // Validate required fields.
  //
  // Email is no longer among them. A helper may hand over an address or a
  // verified phone number, and the number is the stronger of the two: Twilio
  // Verify proves the handset, lib/phone-identity.js allows it on one account
  // only, and an SMS costs an attacker money. An address proves none of that,
  // and for the women this platform is for it is frequently an inbox opened
  // once, at our request, and never read again. See
  // scripts/supabase-helper-email-optional.sql.
  const wantsEmail = !!email?.trim();
  if (!first_name?.trim() || !last_name?.trim() || !city || !category) {
    return res.status(400).json({ error: 'Missing required fields: first name, last name, city, and category are required.' });
  }
  if (!wantsEmail && !phoneToken) {
    return res.status(400).json({ error: 'contact_required' });
  }

  // Nobody registers as "Support" or with our own name in theirs. See
  // lib/impersonation.js — checked here, before any translation or DB work,
  // because a refused signup should cost nothing.
  const impersonation = impersonationBlock({ firstName: first_name, lastName: last_name });
  if (impersonation) {
    console.warn(`[register] refused impersonating name: ${impersonation.field}="${impersonation.value}" (${impersonation.reason})`);
    return res.status(400).json({ error: IMPERSONATION_ERROR, field: impersonation.field });
  }

  // City must be a real Thailand location. The form only offers Thai
  // provinces, but this is the actual gate — a scripted POST could still
  // send a free-text country ("Philippines"), which is exactly how junk
  // locations got in before. Reject anything outside the known slug set.
  if (!VALID_CITY_SLUGS.has(String(city).trim().toLowerCase())) {
    return res.status(400).json({ error: 'Please choose a valid city in Thailand.' });
  }

  // "Area" is shown publicly and unauthenticated on /helpers cards — reject
  // full street addresses (house number + moo/soi) here rather than storing
  // them, since that's an exact-home-location leak, not a neighbourhood name.
  if (looksLikeFullAddress(area_other ?? area)) {
    return res.status(400).json({ error: 'area_full_address' });
  }

  // Clicked areas + the "Other" line. A name typed into the line that is on
  // the list ("chaloong") becomes a clicked area too, so it can be filtered.
  const areaStored = resolveAreaInput(String(city).trim().toLowerCase(), req.body || {});

  // Age gate. The form already validates this, but that check lives in the
  // browser — a scripted POST could register a minor, and our terms (and
  // Thai labour law) require adults. Server side is the actual gate.
  const dobCheck = validateDob(date_of_birth);
  if (!dobCheck.ok) {
    return res.status(400).json({
      error: dobCheck.reason === 'too_young'
        ? 'You must be at least 18 years old to register.'
        : 'Please enter a valid date of birth.',
    });
  }

  // Work permit status is optional. Reject unknown values rather than
  // silently dropping them — keeps the DB CHECK constraint and the
  // client-side option list in sync.
  if (work_permit_status && !WP_STATUS_VALUES.includes(work_permit_status)) {
    return res.status(400).json({ error: 'Invalid work permit status' });
  }

  // Nationality has the same shape — optional, whitelist-validated.
  if (nationality && !NATIONALITY_VALUES.includes(nationality)) {
    return res.status(400).json({ error: 'Invalid nationality' });
  }

  // Gender is required, unlike the two fields above. It drives the browse
  // filter families use most, and a blank here is not a privacy choice —
  // it is a profile that no filtered search will ever return. Safe to
  // require server-side: /register is the only caller (the mobile app has
  // no signup flow of its own), so no shipped client breaks on it.
  if (!GENDER_VALUES.includes(gender)) {
    return res.status(400).json({ error: 'Please select female or male.' });
  }

  // Auto-derive WP status when the helper picks Thai but didn't
  // explicitly fill the WP field — Thai citizens never need a permit,
  // so we save them the extra click.
  const finalWpStatus = work_permit_status
    || deriveWpStatusFromNationality(nationality)
    || null;

  const supabase = getServiceSupabase();
  const ref = generateRef();
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const cleanEmail = wantsEmail ? email.trim().toLowerCase() : null;

  // The number, if she gave one. The proof is minted by
  // /api/phone/signup-verify-otp once Twilio approves a code and names the
  // number it was minted for; a proof lasts 30 minutes, so the ownership
  // check runs again here, immediately before the row is written. Same three
  // checks and the same reasoning as pages/api/employer-signup.js.
  let verifiedPhone = null;
  if (phoneToken) {
    const proof = await readPhoneProof(phoneToken);
    if (!proof) {
      return res.status(400).json({ error: 'phone_not_verified' });
    }
    const owner = await numberTakenBy(supabase, proof.phone, null);
    if (owner.taken) {
      console.warn(`[register] refused: number already held by ${owner.ref}`);
      return res.status(409).json({ error: owner.suspended ? 'phone_blocked' : 'phone_in_use' });
    }
    verifiedPhone = proof;
  }

  // Nothing to confirm when there is no address, and nothing to confirm it
  // with. The number was proved by SMS a moment ago, which is a stronger
  // claim than a clicked link; leaving this false would leave her account
  // in the unverified state for a letter that is never coming.
  // accessDenialReason() in lib/access.js accepts either channel.
  const emailVerifiedAtBirth = !wantsEmail && !!verifiedPhone;
  const sanitizedBio = bio ? sanitizeFreeText(bio.trim()) : null;

  // If the helper opted in to LINE notifications, pre-generate the link
  // token now so the success screen can render the QR + "send this code"
  // instructions without an extra round-trip.
  const lineLinkToken = notify_via_line === true ? generateLineLinkToken() : null;
  const lineLinkExpires = lineLinkToken
    ? new Date(Date.now() + LINE_LINK_TTL_MS).toISOString()
    : null;

  // If the helper typed their name in Thai script, store a romanized version
  // alongside the original so English-reading employers can read it. Same
  // for the bio: store an English translation in `bio_en` so we can render
  // the right version based on the viewer's language. Falls back to raw
  // input if the Translate API is unavailable.
  const [cleanFirstName, cleanLastName, bioEn, areaEn, educationEn] = await Promise.all([
    romanizeThaiName(first_name),
    romanizeThaiName(last_name),
    translateForeignText(sanitizedBio),
    translateForeignText(areaStored.area),
    translateForeignText(education),
  ]);

  try {
    // Insert into helper_profiles
    const { error: insertError } = await supabase
      .from('helper_profiles')
      .insert({
        helper_ref: ref,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        email: cleanEmail,
        phone_number: verifiedPhone?.phone || null,
        phone_country_code: verifiedPhone?.countryCode || null,
        phone_verified_at: verifiedPhone ? new Date().toISOString() : null,
        phone_verified_channel: verifiedPhone ? 'sms' : null,
        date_of_birth: date_of_birth || null,
        age: null, // exact age is now derived from date_of_birth at display time
        category,
        skills: skills || null,
        city,
        area: areaStored.area,
        area_slugs: areaStored.area_slugs,
        area_en: areaEn || null,
        additional_cities: additional_cities || null,
        experience: experience || null,
        languages: languages || null,
        rate: rate || null,
        education: education?.trim() || null,
        education_en: educationEn || null,
        certificates: certificates?.trim() || null,
        bio: sanitizedBio,
        bio_en: bioEn,
        notify_via_line: notify_via_line === true,
        notify_via_whatsapp: notify_via_whatsapp === true,
        work_permit_status: finalWpStatus,
        nationality: nationality || null,
        gender,
        line_link_token: lineLinkToken,
        line_link_expires: lineLinkExpires,
        source: formatAttributionString(attribution),
        email_verified: emailVerifiedAtBirth,
        email_verified_at: emailVerifiedAtBirth ? new Date().toISOString() : null,
        verification_token: wantsEmail ? verificationToken : null,
        // Someone actively registering IS an activity moment — see the
        // matching comment in pages/api/employer-signup.js. Without this,
        // every fresh helper signup showed last_login_at = NULL because
        // the success screen never makes a follow-up authenticated
        // request that would let lib/auth.js's session-touch fix fire.
        last_login_at: new Date().toISOString(),
      });

    if (insertError) {
      // Duplicate email (unique constraint violation)
      if (insertError.code === '23505' && insertError.message.includes('email')) {
        return res.status(409).json({ error: 'duplicate_email' });
      }
      console.error('Registration insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save registration' });
    }

    // Create user_preferences row (for documents, references, etc.)
    //
    // preferred_language here drives which language incoming chat messages
    // get auto-translated INTO (see /api/messages.js). The column defaults
    // to 'en' in the schema, which is wrong for a helper who can't actually
    // read English — an employer's English message would never get
    // translated for them (source === target === 'en', so the translation
    // step is skipped). We derive a sensible default from the languages the
    // helper picked at signup: if they didn't select English, assume they
    // need messages translated into Thai.
    const helperPreferredLanguage =
      String(languages || '').toLowerCase().includes('english') ? 'en' : 'th';
    await supabase
      .from('user_preferences')
      .upsert(
        { helper_ref: ref, email: cleanEmail, preferred_language: helperPreferredLanguage },
        // cleanEmail is NULL for a phone-only signup; the column is only a
        // convenience copy and nothing reads it as a contact channel.
        { onConflict: 'helper_ref' }
      );

    // Auto-login: set session cookie immediately so the next requests
    // (photo upload, profile redirect) are authenticated. Mirrors the
    // employer-signup flow.
    const token = await createToken({
      ref,
      email: cleanEmail,
      firstName: cleanFirstName,
      role: 'helper',
    });
    setSessionCookie(res, token, 'helper');

    // Send confirmation email (don't fail registration if email fails)
    //
    // sendHelperConfirmation is skipped entirely without an address — it
    // carries the verification link and the reference number, and both are
    // meaningless to a phone-only account: there is nothing to verify, and
    // she logs in with the number. The success screen shows her the
    // reference number instead, which is the only place she will ever see
    // it. sendAdminNotification still goes out, so a signup never becomes
    // invisible to us just because it had no inbox.
    try {
      if (process.env.RESEND_API_KEY) {
        await Promise.all([
          ...(cleanEmail ? [sendHelperConfirmation({
            firstName: cleanFirstName,
            email: cleanEmail,
            ref,
            category,
            city,
            verificationToken,
          })] : []),
          sendAdminNotification({
            type: 'helper',
            firstName: cleanFirstName,
            lastName: cleanLastName,
            email: cleanEmail,
            city,
            category,
            ref,
            // The employer mail has carried these since 2026-09-15; the helper
            // one never did. Impersonation works in both directions — a fake
            // "ThaiHelper Support" helper profile would be read by families.
            warnings: impersonationNotes({ firstName: first_name, lastName: last_name }),
          }),
        ]);
      }
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
    }

    return res.status(200).json({
      success: true,
      ref,
      firstName: cleanFirstName,
      // If the helper opted in to LINE, hand back the link instructions so
      // the success screen can render the QR + "send this code" message
      // without a follow-up API call. The token is also stored in the DB.
      lineLink: lineLinkToken ? {
        token: lineLinkToken,
        message: `link ${lineLinkToken}`,
        expiresAt: lineLinkExpires,
        // Full add-friend URL so the success screen can encode it into a
        // QR code without needing the bot id client-side.
        addFriendUrl: getLineAddFriendUrl(),
      } : null,
    });
  } catch (err) {
    console.error('Failed to save helper registration:', err);
    return res.status(500).json({ error: 'Failed to save registration' });
  }
}
