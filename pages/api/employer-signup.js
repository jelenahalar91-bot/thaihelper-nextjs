// POST /api/employer-signup
// Create a full employer account (not just a lead). Returns the employer_ref
// so the client can show it immediately. Sends a confirmation email with the
// ref so the employer can log in later.

import { getServiceSupabase } from '../../lib/supabase';
import { createToken, setSessionCookie } from '../../lib/auth';
import {
  sendEmployerAccountConfirmation,
  sendAdminNotification,
} from '../../lib/send-confirmation-email';

function generateRef() {
  return 'EMP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Promo access during the launch phase:
// When PROMO_ACTIVE=true (env var), every new employer account automatically
// gets free access to contact info for PROMO_DAYS days (default 28).
// After the promo period ends, set PROMO_ACTIVE=false and employers will sign
// up on the free tier and need to upgrade to see WhatsApp / phone numbers.
function getPromoAccess() {
  const active = process.env.PROMO_ACTIVE === 'true';
  if (!active) return { access_until: null, access_tier: 'free' };

  const days = parseInt(process.env.PROMO_DAYS || '28', 10);
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
    arrangementPreference,
    preferredAgeRange,
    jobDescription,
    preferredLanguage,
  } = req.body;

  // Whitelist the arrangement preference — must match the CHECK constraint
  const ARRANGEMENT_VALUES = ['live_in', 'live_out', 'either'];
  const safeArrangement = ARRANGEMENT_VALUES.includes(arrangementPreference)
    ? arrangementPreference
    : null;

  // Validate required fields
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !city) {
    return res.status(400).json({
      error: 'First name, last name, email and city are required.',
    });
  }

  // Sanitize job description: strip phone numbers and emails for privacy
  const sanitizedJobDesc = (jobDescription || '')
    .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[phone hidden]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email hidden]');

  const supabase = getServiceSupabase();
  const ref = generateRef();
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
        city,
        area: area?.trim() || null,
        looking_for: Array.isArray(lookingFor) ? lookingFor.join(', ') : (lookingFor || null),
        arrangement_preference: safeArrangement,
        preferred_age_range: preferredAgeRange || null,
        job_description: sanitizedJobDesc || null,
        preferred_language: preferredLanguage || 'en',
        access_until: promo.access_until,
        access_tier: promo.access_tier,
        source: 'thaihelper.app/employer-register',
      })
      .select('employer_ref, first_name, email, city, access_until, access_tier')
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
        await Promise.all([
          sendEmployerAccountConfirmation({
            firstName: inserted.first_name,
            email: inserted.email,
            ref: inserted.employer_ref,
            city: inserted.city,
          }),
          sendAdminNotification({
            type: 'employer',
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            city,
            area: (area || '').trim(),
            helperTypes: Array.isArray(lookingFor) ? lookingFor.join(', ') : (lookingFor || ''),
            ref: inserted.employer_ref,
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
