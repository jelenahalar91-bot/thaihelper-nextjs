// POST /api/family-followup { t, answer }  → record the answer from the email
// POST /api/family-followup { t, source }  → the optional "where?" follow-up
//
// The landing half of the "are you still looking?" email
// (lib/emails/status-checkin.js). The token names the family and nothing
// else; the answer is whitelisted here. No session — see
// lib/family-followup-token.js for why a login would defeat the purpose.
//
// POST ONLY, AND DELIBERATELY SO. The obvious design is a GET link straight
// from the email, which is what the unsubscribe flow does. It is wrong here:
// corporate mail gateways and security scanners fetch every link in an
// incoming message before the human sees it. A scanner following "I'm not
// looking any more" would hide a family's profile, and one following "I
// found someone on ThaiHelper" would record a hire that never happened —
// into the one table this whole project exists to keep honest. So the email
// links to /search-status, a page with no side effect, and the page posts
// the answer once it is actually open in a browser.
//
// Each answer does two things: it sets search_status, so helpers stop
// writing to a family that is done, and it writes a row to hiring_outcomes
// with trigger 'email', so the result lands in the same log as the dashboard
// prompt and the chat strip. Answering also ends the check-in series — one
// reply is all we ask for.

import { getServiceSupabase } from '../../lib/supabase';
import { verifyFollowupToken, FOLLOWUP_ANSWERS } from '../../lib/family-followup-token';
import { checkRateLimit } from '../../lib/rate-limit';

const MAX_CHECKINS = 3;

// answer → what it means for the listing, and what it means for the log.
const EFFECT = {
  still_searching: { search_status: 'searching', outcome: 'still_searching' },
  // "Found someone" pauses rather than hides: they stay listed with a badge,
  // existing conversations keep working, and they can hide fully from the
  // dashboard. Hiding someone on the strength of one tap in an email is more
  // than the tap asked for.
  found_here: { search_status: 'paused', outcome: 'hired_here' },
  found_elsewhere: { search_status: 'paused', outcome: 'hired_elsewhere' },
  not_looking: { search_status: 'hidden', outcome: 'stopped_looking' },
};

const SOURCES = ['agency', 'facebook', 'friends', 'other'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const supabase = getServiceSupabase();
  const { t, answer, source } = req.body || {};

  const payload = await verifyFollowupToken(t);
  if (!payload) return res.status(400).json({ error: 'invalid_token' });

  // The token is long-lived and sits in an inbox; nobody needs to answer the
  // same question twenty times an hour.
  const withinRate = await checkRateLimit({
    bucket: 'family-followup',
    key: payload.ref,
    max: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!withinRate) return res.status(429).json({ error: 'too_many_requests' });

  // ─── The optional second question: where did you find them? ───────────
  if (source !== undefined) {
    if (!SOURCES.includes(source)) return res.status(400).json({ error: 'invalid_source' });

    // Refine the answer already on file rather than adding a second one —
    // two hired_elsewhere rows for one family would quietly double the
    // number this table exists to report.
    const { data: existing } = await supabase
      .from('hiring_outcomes')
      .select('id')
      .eq('employer_ref', payload.ref)
      .eq('reported_by', 'employer')
      .eq('outcome', 'hired_elsewhere')
      .eq('trigger', 'email')
      .is('source', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from('hiring_outcomes').update({ source }).eq('id', existing.id)
      : await supabase.from('hiring_outcomes').insert({
          reported_by: 'employer',
          employer_ref: payload.ref,
          outcome: 'hired_elsewhere',
          source,
          trigger: 'email',
        });

    if (error) {
      console.error('Family follow-up source error:', error);
      return res.status(500).json({ error: 'save_failed' });
    }
    return res.status(200).json({ ok: true });
  }

  // ─── The answer itself ────────────────────────────────────────────────
  if (!FOLLOWUP_ANSWERS.includes(answer)) {
    return res.status(400).json({ error: 'invalid_answer' });
  }

  const effect = EFFECT[answer];
  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('employer_accounts')
    .update({
      search_status: effect.search_status,
      status_checkin_answered_at: now,
      // They answered; the series is over however many rounds were left.
      status_checkin_count: MAX_CHECKINS,
    })
    .eq('employer_ref', payload.ref);

  if (updateErr) {
    console.error('Family follow-up update error:', updateErr);
    return res.status(500).json({ error: 'save_failed' });
  }

  // Re-opening the same link should not log the same answer twice. One row
  // per family per answer is enough to report on.
  const { data: already } = await supabase
    .from('hiring_outcomes')
    .select('id')
    .eq('employer_ref', payload.ref)
    .eq('reported_by', 'employer')
    .eq('outcome', effect.outcome)
    .eq('trigger', 'email')
    .limit(1)
    .maybeSingle();

  if (!already) {
    const { error: outcomeErr } = await supabase.from('hiring_outcomes').insert({
      reported_by: 'employer',
      employer_ref: payload.ref,
      outcome: effect.outcome,
      trigger: 'email',
    });
    if (outcomeErr) console.warn('hiring_outcomes insert failed:', outcomeErr.message);
  }

  return res.status(200).json({ ok: true, answer });
}
