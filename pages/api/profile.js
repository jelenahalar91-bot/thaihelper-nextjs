// GET /api/profile — Fetch helper profile
// PUT /api/profile — Update helper profile

import { getSession } from '../../lib/auth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb', // Allow photo uploads
    },
  },
};

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const SHEET_URL = process.env.GOOGLE_SHEETS_URL;
  if (!SHEET_URL) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // GET — Fetch profile
  if (req.method === 'GET') {
    try {
      const response = await fetch(SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lookup',
          email: session.email,
          ref: session.ref,
        }),
      });

      const result = await response.json();

      if (!result.found) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({ success: true, profile: result.data });
    } catch (err) {
      console.error('Profile fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  // PUT — Update profile
  if (req.method === 'PUT') {
    try {
      const updates = req.body;

      // Don't allow changing ref or email
      delete updates.ref;
      delete updates.email;
      delete updates.timestamp;

      const response = await fetch(SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          ref: session.ref,
          email: session.email,
          updates,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Update failed');
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Profile update error:', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
