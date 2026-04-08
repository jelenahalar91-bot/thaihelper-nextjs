// POST /api/register
// Receives helper registration data, saves to Supabase, sends confirmation
// email, and signs the new helper in immediately so the client can upload a
// profile photo and land on /profile without a manual login step.

import { getServiceSupabase } from '../../lib/supabase';
import { createToken, setSessionCookie } from '../../lib/auth';
import { sendHelperConfirmation, sendAdminNotification } from '../../lib/send-confirmation-email';

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
    first_name, last_name, age, category, skills,
    city, area, experience, languages, rate,
    education, certificates, bio, email,
  } = req.body;

  // Validate required fields
  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !city || !category) {
    return res.status(400).json({ error: 'Missing required fields: first name, last name, email, city, and category are required.' });
  }

  const supabase = getServiceSupabase();
  const ref = generateRef();
  const cleanEmail = email.trim().toLowerCase();
  const cleanFirstName = first_name.trim();
  const sanitizedBio = bio ? sanitizeFreeText(bio.trim()) : null;

  try {
    // Insert into helper_profiles
    const { error: insertError } = await supabase
      .from('helper_profiles')
      .insert({
        helper_ref: ref,
        first_name: cleanFirstName,
        last_name: last_name.trim(),
        email: cleanEmail,
        age: age || null,
        category,
        skills: skills || null,
        city,
        area: area || null,
        experience: experience || null,
        languages: languages || null,
        rate: rate || null,
        education: education?.trim() || null,
        certificates: certificates?.trim() || null,
        bio: sanitizedBio,
        source: 'thaihelper.app/register',
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
          }),
          sendAdminNotification({
            type: 'helper',
            firstName: cleanFirstName,
            lastName: last_name.trim(),
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
