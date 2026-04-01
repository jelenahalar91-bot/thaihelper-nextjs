// POST /api/employer-register
// Receives employer registration data, saves to Google Sheet, and sends confirmation email

import { sendEmployerConfirmation, sendAdminNotification } from '../../lib/send-confirmation-email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, city, helperTypes, jobDescription } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !city || !helperTypes?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const SHEET_URL = process.env.EMPLOYER_SHEET_URL;

  if (!SHEET_URL) {
    console.error('EMPLOYER_SHEET_URL not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Sanitize job description: remove phone numbers and emails
  const sanitizedJobDesc = (jobDescription || '')
    .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[phone hidden]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email hidden]');

  const payload = {
    timestamp: new Date().toISOString(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    city,
    helperTypes: helperTypes.join(', '),
    jobDescription: sanitizedJobDesc,
    source: 'thaihelper.app/employers',
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
        await Promise.all([
          sendEmployerConfirmation({
            firstName: payload.firstName,
            email: payload.email,
            city: payload.city,
            helperTypes: payload.helperTypes,
          }),
          sendAdminNotification({
            type: 'employer',
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            city: payload.city,
            helperTypes: payload.helperTypes,
          }),
        ]);
      }
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
      // Don't fail the registration — email is best-effort
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to save employer registration:', err);
    return res.status(500).json({ error: 'Failed to save registration' });
  }
}
