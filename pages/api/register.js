// POST /api/register
// Receives helper registration data, saves to Supabase, sends confirmation email

import { getServiceSupabase } from '../../lib/supabase';
import { sendHelperConfirmation, sendAdminNotification } from '../../lib/send-confirmation-email';

function generateRef() {
  return 'TH-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    first_name, last_name, age, category, skills,
    city, area, experience, languages, rate,
    education, certificates, bio,
    whatsapp, hasWhatsApp, email,
  } = req.body;

  // Validate required fields
  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !city || !category) {
    return res.status(400).json({ error: 'Missing required fields: first name, last name, email, city, and category are required.' });
  }

  const supabase = getServiceSupabase();
  const ref = generateRef();

  try {
    // Insert into helper_profiles
    const { error: insertError } = await supabase
      .from('helper_profiles')
      .insert({
        helper_ref: ref,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
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
        bio: bio?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        has_whatsapp: hasWhatsApp ? true : false,
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
        { helper_ref: ref, email: email.trim().toLowerCase() },
        { onConflict: 'helper_ref' }
      );

    // Send confirmation email (don't fail registration if email fails)
    try {
      if (process.env.RESEND_API_KEY) {
        await Promise.all([
          sendHelperConfirmation({
            firstName: first_name.trim(),
            email: email.trim().toLowerCase(),
            ref,
            category,
            city,
          }),
          sendAdminNotification({
            type: 'helper',
            firstName: first_name.trim(),
            lastName: last_name.trim(),
            email: email.trim().toLowerCase(),
            city,
            category,
            ref,
          }),
        ]);
      }
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
    }

    return res.status(200).json({ success: true, ref });
  } catch (err) {
    console.error('Failed to save helper registration:', err);
    return res.status(500).json({ error: 'Failed to save registration' });
  }
}
