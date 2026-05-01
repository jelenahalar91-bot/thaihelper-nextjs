// POST /api/register
// Receives helper registration data, saves to Supabase, sends confirmation
// email, and signs the new helper in immediately so the client can upload a
// profile photo and land on /profile without a manual login step.

import crypto from 'crypto';
import { getServiceSupabase } from '../../lib/supabase';
import { createToken, setSessionCookie } from '../../lib/auth';
import { sendHelperConfirmation, sendAdminNotification } from '../../lib/send-confirmation-email';
import { verifyTurnstile } from '../../lib/turnstile';
import { romanizeThaiName, translateForeignText } from '../../lib/translate';
import { formatAttributionString } from '../../lib/utm';

function generateRef() {
  return 'TH-' + Math.random().toString(36).substr(2, 6).toUpperCase();
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
    city, area, additional_cities, experience, languages, rate,
    education, certificates, bio, email,
    notify_via_line, notify_via_whatsapp,
    turnstileToken, attribution,
  } = req.body;

  // Verify Turnstile CAPTCHA
  const captcha = await verifyTurnstile(turnstileToken);
  if (!captcha.success) {
    return res.status(403).json({ error: captcha.error });
  }

  // Validate required fields
  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !city || !category) {
    return res.status(400).json({ error: 'Missing required fields: first name, last name, email, city, and category are required.' });
  }

  const supabase = getServiceSupabase();
  const ref = generateRef();
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const cleanEmail = email.trim().toLowerCase();
  const sanitizedBio = bio ? sanitizeFreeText(bio.trim()) : null;

  // If the helper typed their name in Thai script, store a romanized version
  // alongside the original so English-reading employers can read it. Same
  // for the bio: store an English translation in `bio_en` so we can render
  // the right version based on the viewer's language. Falls back to raw
  // input if the Translate API is unavailable.
  const [cleanFirstName, cleanLastName, bioEn] = await Promise.all([
    romanizeThaiName(first_name),
    romanizeThaiName(last_name),
    translateForeignText(sanitizedBio),
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
        date_of_birth: date_of_birth || null,
        age: null, // exact age is now derived from date_of_birth at display time
        category,
        skills: skills || null,
        city,
        area: area || null,
        additional_cities: additional_cities || null,
        experience: experience || null,
        languages: languages || null,
        rate: rate || null,
        education: education?.trim() || null,
        certificates: certificates?.trim() || null,
        bio: sanitizedBio,
        bio_en: bioEn,
        notify_via_line: notify_via_line === true,
        notify_via_whatsapp: notify_via_whatsapp === true,
        source: formatAttributionString(attribution),
        email_verified: false,
        verification_token: verificationToken,
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
    await supabase
      .from('user_preferences')
      .upsert(
        { helper_ref: ref, email: cleanEmail },
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
    try {
      if (process.env.RESEND_API_KEY) {
        await Promise.all([
          sendHelperConfirmation({
            firstName: cleanFirstName,
            email: cleanEmail,
            ref,
            category,
            city,
            verificationToken,
          }),
          sendAdminNotification({
            type: 'helper',
            firstName: cleanFirstName,
            lastName: cleanLastName,
            email: cleanEmail,
            city,
            category,
            ref,
          }),
        ]);
      }
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
    }

    return res.status(200).json({ success: true, ref, firstName: cleanFirstName });
  } catch (err) {
    console.error('Failed to save helper registration:', err);
    return res.status(500).json({ error: 'Failed to save registration' });
  }
}
