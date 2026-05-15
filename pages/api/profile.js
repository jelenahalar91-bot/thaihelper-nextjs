// GET /api/profile — Fetch helper profile from Supabase
// PUT /api/profile — Update helper profile in Supabase

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { translateForeignText } from '../../lib/translate';
import { getDisplayAge } from '../../lib/age';
import { WP_STATUS_VALUES } from '../../lib/constants/work-permit';
import { NATIONALITY_VALUES, deriveWpStatusFromNationality } from '../../lib/constants/nationalities';
import { notifyEmployersOfNewHelper } from '../../lib/match-notifications';

// Strip phone numbers and email addresses from free-text fields. Mirrors the
// sanitizer used on registration (pages/api/register.js) so helpers can't
// bypass the mask by editing their profile after signup and dropping contact
// info into the bio — the whole point of on-platform messaging is that
// families contact helpers THROUGH ThaiHelper, not around it.
function sanitizeFreeText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[contact hidden]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[contact hidden]');
}

// Columns whose contents are shown publicly on /helpers and must be scrubbed.
const SANITIZED_FIELDS = new Set([
  'bio',
  'skills',
  'education',
  'certificates',
  'experience',
]);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// Map Supabase snake_case → frontend camelCase
function toFrontend(row) {
  return {
    ref: row.helper_ref,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    age: getDisplayAge(row),
    dateOfBirth: row.date_of_birth || '',
    category: row.category || '',
    skills: row.skills || '',
    city: row.city || '',
    area: row.area || '',
    areaEn: row.area_en || '',
    availabilityStatus: row.availability_status || 'available',
    additionalCities: row.additional_cities || '',
    experience: row.experience || '',
    languages: row.languages || '',
    rate: row.rate || '',
    education: row.education || '',
    educationEn: row.education_en || '',
    certificates: row.certificates || '',
    bio: row.bio || '',
    bioEn: row.bio_en || '',
    whatsapp: row.whatsapp || '',
    hasWhatsApp: row.has_whatsapp ? 'Yes' : 'No',
    photo: row.photo_url || '',
    source: row.source || '',
    timestamp: row.created_at || '',
    status: row.status || 'active',
    emailVerified: row.email_verified === true,
    // Treat NULL as opted-in (the default) so the toggle shows on in the UI
    // until the user explicitly opts out.
    notifyOnMessage: row.notify_on_message !== false,
    wpStatus: row.work_permit_status || null,
    nationality: row.nationality || null,
  };
}

// Map frontend camelCase → Supabase snake_case
const fieldMap = {
  firstName: 'first_name',
  lastName: 'last_name',
  age: 'age',
  dateOfBirth: 'date_of_birth',
  category: 'category',
  skills: 'skills',
  city: 'city',
  area: 'area',
  availabilityStatus: 'availability_status',
  additionalCities: 'additional_cities',
  experience: 'experience',
  languages: 'languages',
  rate: 'rate',
  education: 'education',
  educationEn: 'education_en',
  certificates: 'certificates',
  bio: 'bio',
  whatsapp: 'whatsapp',
  hasWhatsApp: 'has_whatsapp',
  photo: 'photo_url',
  notifyOnMessage: 'notify_on_message',
  wpStatus: 'work_permit_status',
  nationality: 'nationality',
};

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const supabase = getServiceSupabase();

  // GET — Fetch profile
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('helper_profiles')
        .select('*')
        .eq('helper_ref', session.ref)
        .eq('email', session.email)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({ success: true, profile: toFrontend(data) });
    } catch (err) {
      console.error('Profile fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  // PUT — Update profile
  if (req.method === 'PUT') {
    try {
      const incoming = req.body;

      // Reject unknown work_permit_status values rather than letting the
      // DB CHECK constraint fail with a 500. Empty string is treated as
      // "clear the field".
      if (
        incoming.wpStatus !== undefined
        && incoming.wpStatus !== null
        && incoming.wpStatus !== ''
        && !WP_STATUS_VALUES.includes(incoming.wpStatus)
      ) {
        return res.status(400).json({ error: 'Invalid work permit status' });
      }

      // Same shape for availability_status.
      const AVAILABILITY_VALUES = ['available', 'open_to_offers', 'working'];
      if (
        incoming.availabilityStatus !== undefined
        && incoming.availabilityStatus !== null
        && !AVAILABILITY_VALUES.includes(incoming.availabilityStatus)
      ) {
        return res.status(400).json({ error: 'Invalid availability status' });
      }

      // Same shape for nationality.
      if (
        incoming.nationality !== undefined
        && incoming.nationality !== null
        && incoming.nationality !== ''
        && !NATIONALITY_VALUES.includes(incoming.nationality)
      ) {
        return res.status(400).json({ error: 'Invalid nationality' });
      }

      // If the helper switched to "thai" and didn't already have a WP
      // status, auto-derive it. We don't overwrite a manually-set value.
      if (
        incoming.nationality === 'thai'
        && (incoming.wpStatus === undefined || incoming.wpStatus === '' || incoming.wpStatus === null)
      ) {
        const derived = deriveWpStatusFromNationality('thai');
        if (derived) incoming.wpStatus = derived;
      }

      // Build update object with snake_case keys
      const updates = {};
      for (const [frontKey, value] of Object.entries(incoming)) {
        const dbKey = fieldMap[frontKey];
        if (dbKey) {
          // Special handling for hasWhatsApp boolean
          if (frontKey === 'hasWhatsApp') {
            updates[dbKey] = value === 'Yes' || value === true;
          } else if (SANITIZED_FIELDS.has(dbKey) && typeof value === 'string') {
            // Strip phone/email from publicly-visible free-text fields so
            // helpers can't route families around on-platform messaging by
            // editing their profile after signup.
            updates[dbKey] = sanitizeFreeText(value);
          } else if (frontKey === 'wpStatus' || frontKey === 'nationality') {
            // Empty string would violate the CHECK constraint — store as null.
            updates[dbKey] = value || null;
          } else {
            updates[dbKey] = value;
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // If bio changed, re-translate. Pass null when the new bio has no Thai
      // script so we don't leave a stale English translation lying around.
      if ('bio' in updates) {
        updates.bio_en = await translateForeignText(updates.bio);
      }

      // Same for area — translate to English when the helper updates it
      // so families viewing in EN see a Latin-script district name.
      if ('area' in updates) {
        updates.area_en = await translateForeignText(updates.area);
      }

      // If date_of_birth was set, clear the legacy age range so display logic
      // (getDisplayAge) prefers the DOB-based exact age and doesn't fall back
      // to a stale "35–39" string.
      if (updates.date_of_birth) {
        updates.age = null;
      }

      // Read previous city/category so we can detect material changes after
      // the update and re-fire the match notifier (existing employers in the
      // helper's new city / new category should hear about them).
      let prev = null;
      if ('city' in updates || 'category' in updates) {
        const { data } = await supabase
          .from('helper_profiles')
          .select('city, category, first_name, email_verified')
          .eq('helper_ref', session.ref)
          .eq('email', session.email)
          .single();
        prev = data || null;
      }

      const { error } = await supabase
        .from('helper_profiles')
        .update(updates)
        .eq('helper_ref', session.ref)
        .eq('email', session.email);

      if (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      // Re-trigger match notifications when the helper actually moved or
      // switched category. Only verified helpers ever produce matches, so
      // skip the call entirely while the account is still unverified.
      if (prev?.email_verified) {
        const cityChanged     = 'city' in updates     && updates.city     !== prev.city;
        const categoryChanged = 'category' in updates && updates.category !== prev.category;
        if (cityChanged || categoryChanged) {
          try {
            await notifyEmployersOfNewHelper({
              helper_ref: session.ref,
              first_name: prev.first_name || '',
              city:     updates.city     ?? prev.city,
              category: updates.category ?? prev.category,
            });
          } catch (err) {
            console.error('Match re-trigger on helper profile update failed:', err.message);
          }
        }
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Profile update error:', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
