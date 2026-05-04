// POST /api/wizard-analytics
// Anonymous tracking of wizard completions and CTA clicks. No auth — the
// wizard is public. Inputs are validated against the same option lists
// the wizard form uses, so junk payloads don't pollute the analytics
// table.

import { getServiceSupabase } from '../../lib/supabase';
import {
  NATIONALITY_VALUES,
  HELPER_STATUS_VALUES,
  VISA_TYPE_VALUES,
  DURATION_VALUES,
} from '../../lib/wizard-logic';
import { CITIES } from '../../lib/constants/cities';

const RESULT_FLOWS = ['no_wp_needed', 'not_worth_it', 'worth_it_but_slow', 'worth_it'];
const RESULT_TRACKS = ['mou', 'non_b'];

// Bound the free-text fields so a malicious caller can't drop megabytes
// of garbage into the analytics table.
function clip(value, max = 64) {
  if (value == null) return null;
  const str = String(value).trim();
  if (!str) return null;
  return str.length > max ? str.slice(0, max) : str;
}

// Coerce a value to one of the allowed enum members, otherwise null.
function pickEnum(value, allowed) {
  return allowed.includes(value) ? value : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      sessionId,
      city,
      nationality,
      helperStatus,
      visaType,
      duration,
      resultFlow,
      resultTrack,
      ctaClicked,
    } = req.body || {};

    const supabase = getServiceSupabase();
    const { error } = await supabase.from('wizard_analytics').insert({
      session_id:   clip(sessionId, 64),
      city:         pickEnum(city, CITIES),
      nationality:  pickEnum(nationality, NATIONALITY_VALUES),
      helper_status: pickEnum(helperStatus, HELPER_STATUS_VALUES),
      visa_type:    pickEnum(visaType, VISA_TYPE_VALUES),
      duration:     pickEnum(duration, DURATION_VALUES),
      result_flow:  pickEnum(resultFlow, RESULT_FLOWS),
      result_track: pickEnum(resultTrack, RESULT_TRACKS),
      cta_clicked:  clip(ctaClicked, 64),
    });

    if (error) {
      console.error('wizard_analytics insert failed:', error);
      // Analytics failures must not block the user — return success
      // anyway so the wizard CTA navigation isn't held up. We've logged
      // the error for follow-up.
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('wizard-analytics handler error:', err);
    // Same rationale: never bubble up to the user.
    return res.status(200).json({ ok: true });
  }
}
