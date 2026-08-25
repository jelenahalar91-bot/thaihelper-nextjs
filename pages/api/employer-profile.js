// GET  /api/employer-profile — Get the current employer's profile
// PUT  /api/employer-profile — Update the current employer's profile
// DELETE /api/employer-profile — Permanently delete the employer account

import { getEmployerSession, clearSessionCookie } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { notifyHelpersOfNewEmployer } from '../../lib/match-notifications';
import { translateForeignText } from '../../lib/translate';
import { looksLikeFullAddress } from '../../lib/address-guard';
import { buildJobDetailsPatch } from '../../lib/employer-job-details';

const EDITABLE_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'city',
  'area',
  'looking_for',
  'needed_skills',
  'schedule_days',
  'schedule_time',
  'duration',
  'child_age_groups',
  'arrangement_preference',
  'start_timing',
  'preferred_age_range',
  'job_description',
  'preferred_language',
  'notify_on_message',
  'search_status',
];

// Employer hiring status — see scripts/supabase-employer-search-status.sql.
const SEARCH_STATUS_VALUES = ['searching', 'paused', 'hidden'];

// Fields that may arrive as either an array (from chip toggles) or a CSV
// string. We normalise both into a comma-separated string for storage so
// reads always look the same.
const ARRAY_OR_CSV_FIELDS = ['looking_for', 'needed_skills', 'schedule_days', 'schedule_time', 'child_age_groups'];

const ARRANGEMENT_VALUES = ['live_in', 'live_out', 'either'];

// See scripts/supabase-employer-start-timing.sql.
const START_TIMING_VALUES = ['immediate', 'within_2_weeks', 'within_1_month', 'flexible'];

export default async function handler(req, res) {
  const session = await getEmployerSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const { ref } = session;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('employer_accounts')
      .select(
        'employer_ref, first_name, last_name, email, phone, city, area, ' +
        'looking_for, needed_skills, schedule_days, schedule_time, duration, ' +
        'child_age_groups, arrangement_preference, start_timing, preferred_age_range, ' +
        'job_description, job_details, preferred_language, photo_url, notify_on_message, ' +
        'search_status, ' +
        'access_until, access_tier, email_verified, created_at, last_login_at, ' +
        // Phone-verification fields (added 2026-06-09).
        'phone_number, phone_country_code, phone_verified_at, ' +
        'phone_verified_channel, line_linked_at'
      )
      .eq('employer_ref', ref)
      .single();

    if (error || !data) {
      console.error('Employer profile load error:', error);
      return res.status(404).json({ error: 'Employer not found' });
    }

    return res.status(200).json({ success: true, profile: data });
  }

  if (req.method === 'PUT') {
    const body = req.body || {};

    // Only allow known fields to be updated
    const patch = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const value = body[field];
        patch[field] =
          typeof value === 'string' ? value.trim() || null : value;
      }
    }

    // "Area" is shown publicly and unauthenticated on /employers-browse
    // cards — reject full street addresses (house number + moo/soi) rather
    // than storing them, since that's an exact-home-location leak, not a
    // neighbourhood name.
    if ('area' in patch && looksLikeFullAddress(patch.area)) {
      return res.status(400).json({ error: 'area_full_address' });
    }

    // Whitelist arrangement preference (matches DB CHECK constraint)
    if ('arrangement_preference' in patch && patch.arrangement_preference) {
      if (!ARRANGEMENT_VALUES.includes(patch.arrangement_preference)) {
        patch.arrangement_preference = null;
      }
    }

    // Whitelist start timing (matches DB CHECK constraint)
    if ('start_timing' in patch && patch.start_timing) {
      if (!START_TIMING_VALUES.includes(patch.start_timing)) {
        patch.start_timing = null;
      }
    }

    // Whitelist search status (matches DB CHECK constraint). An invalid
    // value would otherwise hit the constraint and 500 the whole update,
    // so we reject it up front rather than silently nulling — null isn't
    // allowed by the NOT NULL column.
    if ('search_status' in patch) {
      if (!SEARCH_STATUS_VALUES.includes(patch.search_status)) {
        return res.status(400).json({ error: 'Invalid search_status' });
      }
    }

    // looking_for / needed_skills / schedule_* / child_age_groups can come
    // as either array or CSV string — normalise to CSV.
    for (const field of ARRAY_OR_CSV_FIELDS) {
      if (field in body && Array.isArray(body[field])) {
        patch[field] = body[field].join(', ') || null;
      }
    }

    // Sanitize job description, then refresh its English translation so the
    // English UI stays in sync when an employer edits their post. Null when
    // the (sanitized) text is already English or the field is cleared.
    if ('job_description' in patch) {
      if (patch.job_description) {
        patch.job_description = patch.job_description
          .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[phone hidden]')
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email hidden]');
        patch.job_description_en = (await translateForeignText(patch.job_description)) || null;
      } else {
        patch.job_description_en = null;
      }
    }

    // Per-category job descriptions ({ nanny: "text", … }). Sanitised,
    // translated and flattened into the legacy job_description pair by
    // buildJobDetailsPatch — applied after the block above so job_details
    // wins if a client ever sends both.
    if ('job_details' in body) {
      const jobPatch = await buildJobDetailsPatch(body.job_details);
      if (jobPatch) Object.assign(patch, jobPatch);
    }

    patch.updated_at = new Date().toISOString();

    // Read previous city/looking_for so we can detect material changes after
    // the update and re-fire the match notifier (existing helpers in the
    // employer's new city / new categories should hear about them).
    let prev = null;
    if ('city' in patch || 'looking_for' in patch) {
      const { data } = await supabase
        .from('employer_accounts')
        .select('city, looking_for, first_name, email_verified')
        .eq('employer_ref', ref)
        .single();
      prev = data || null;
    }

    const { error } = await supabase
      .from('employer_accounts')
      .update(patch)
      .eq('employer_ref', ref);

    if (error) {
      console.error('Employer profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Re-trigger match notifications when the employer actually moved or
    // changed which categories they're looking for. Skip while unverified.
    if (prev?.email_verified) {
      const cityChanged    = 'city' in patch         && patch.city         !== prev.city;
      const lookingChanged = 'looking_for' in patch  && patch.looking_for  !== prev.looking_for;
      if (cityChanged || lookingChanged) {
        try {
          await notifyHelpersOfNewEmployer({
            employer_ref: ref,
            first_name:  prev.first_name || '',
            city:        patch.city        ?? prev.city,
            looking_for: patch.looking_for ?? prev.looking_for,
          });
        } catch (err) {
          console.error('Match re-trigger on employer profile update failed:', err.message);
        }
      }
    }

    return res.status(200).json({ success: true });
  }

  // DELETE — Permanently delete the employer account and all related data.
  // Required by App Store guideline 5.1.1(v); irreversible by design.
  if (req.method === 'DELETE') {
    try {
      const ref = session.ref;

      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .eq('employer_id', ref);
      const convIds = (convs || []).map((c) => c.id);
      if (convIds.length > 0) {
        await supabase.from('messages').delete().in('conversation_id', convIds);
        await supabase.from('conversations').delete().in('id', convIds);
      }

      await supabase.from('helper_ratings').delete().eq('employer_ref', ref);
      await supabase.from('helper_favorites').delete().eq('employer_ref', ref);
      await supabase.from('push_subscriptions').delete()
        .eq('user_role', 'employer').eq('user_ref', ref);

      const { error } = await supabase
        .from('employer_accounts')
        .delete()
        .eq('employer_ref', ref);
      if (error) {
        console.error('Employer account deletion failed:', error.message);
        return res.status(500).json({ error: 'Failed to delete account' });
      }

      clearSessionCookie(res, 'employer');
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Employer account deletion error:', err);
      return res.status(500).json({ error: 'Failed to delete account' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
