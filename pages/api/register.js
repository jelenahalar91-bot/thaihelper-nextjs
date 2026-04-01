// POST /api/register
// Receives helper registration data, saves to Google Sheet, and sends confirmation email

import { sendHelperConfirmation } from '../../lib/send-confirmation-email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    ref, first_name, last_name, age, category, skills,
    city, area, experience, languages, rate, bio,
    whatsapp, hasWhatsApp, email,
  } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !email || !city || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const SHEET_URL = process.env.GOOGLE_SHEETS_URL;

  if (!SHEET_URL) {
    console.error('GOOGLE_SHEETS_URL not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const payload = {
    timestamp: new Date().toISOString(),
    ref,
    firstName: first_name.trim(),
    lastName: last_name.trim(),
    age,
    category,
    skills,
    city,
    area: area || '',
    experience: experience || '',
    languages: languages || '',
    rate: rate || '',
    bio: bio || '',
    whatsapp: whatsapp || '',
    hasWhatsApp: hasWhatsApp ? 'Yes' : 'No',
    email: email.trim().toLowerCase(),
    source: 'thaihelper.app/register',
  };

  try {
    const response = await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google Sheet responded with ${response.status}`);
    }

    // Send confirmation email (don't fail the registration if email fails)
    try {
      if (process.env.RESEND_API_KEY) {
        await sendHelperConfirmation({
          firstName: first_name.trim(),
          email: email.trim().toLowerCase(),
          ref,
          category,
          city,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
      // Don't fail the registration — email is best-effort
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to save helper registration:', err);
    return res.status(500).json({ error: 'Failed to save registration' });
  }
}
