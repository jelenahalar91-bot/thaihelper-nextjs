// POST /api/employer-register
// Receives employer registration data, saves to Supabase, sends confirmation email

import { getServiceSupabase } from '../../lib/supabase';
import { sendEmployerConfirmation, sendAdminNotification } from '../../lib/send-confirmation-email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, city, area, helperTypes, jobDescription } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !city || !helperTypes?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Sanitize job description: remove phone numbers and emails
  const sanitizedJobDesc = (jobDescription || '')
    .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[phone hidden]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email hidden]');

  const supabase = getServiceSupabase();

  try {
    const { error: insertError } = await supabase
      .from('employer_registrations')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        city,
        area: (area || '').trim() || null,
        helper_types: helperTypes.join(', '),
        job_description: sanitizedJobDesc || null,
        source: 'thaihelper.app/employers',
      });

    if (insertError) {
      // Duplicate email
      if (insertError.code === '23505' && insertError.message.includes('email')) {
        return res.status(409).json({ error: 'duplicate_email' });
      }
      console.error('Employer registration error:', insertError);
      return res.status(500).json({ error: 'Failed to save registration' });
    }

    // Send confirmation email (don't fail registration if email fails)
    try {
      if (process.env.RESEND_API_KEY) {
        await Promise.all([
          sendEmployerConfirmation({
            firstName: firstName.trim(),
            email: email.trim().toLowerCase(),
            city,
            helperTypes: helperTypes.join(', '),
          }),
          sendAdminNotification({
            type: 'employer',
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            city,
            area: (area || '').trim(),
            helperTypes: helperTypes.join(', '),
          }),
        ]);
      }
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to save employer registration:', err);
    return res.status(500).json({ error: 'Failed to save registration' });
  }
}
