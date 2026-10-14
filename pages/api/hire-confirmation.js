// GET  /api/hire-confirmation?employer=EMP-XXXX → has this helper already said yes?
// POST /api/hire-confirmation { employerRef }   → record it + email the family once
//
// Helper-session only. This is the helper's half of the review loop: hiring
// happens off-platform, so nothing in the schema ever knew a job had started
// — which is why three and a half months produced three reviews. A helper who
// got the job presses one button, and the family gets one email asking them
// to say how it went.
//
// The recording itself lives in lib/hire-confirmation.js since 2026-10-14,
// because the same statement can now also be made from the "why are you
// hiding your profile?" prompt (pages/api/hiring-outcome.js).
//
// Guards against this becoming a way to pester families:
//   - the two must actually have a conversation here,
//   - UNIQUE(helper_ref, employer_ref) means one email per pair, ever,
//   - the family's notify_on_message opt-out is honoured.

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { recordHireConfirmation, haveConversation } from '../../lib/hire-confirmation';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const helper_ref = session.ref;

  if (req.method === 'GET') {
    const employerRef = String(req.query.employer || '').trim().toUpperCase();
    if (!employerRef) return res.status(400).json({ error: 'employer required' });

    const { data } = await supabase
      .from('hire_confirmations')
      .select('created_at')
      .eq('helper_ref', helper_ref)
      .eq('employer_ref', employerRef)
      .maybeSingle();

    return res.status(200).json({ confirmed: !!data, confirmedAt: data?.created_at || null });
  }

  if (req.method === 'POST') {
    const employerRef = String(req.body?.employerRef || '').trim().toUpperCase();
    if (!employerRef) return res.status(400).json({ error: 'employerRef required' });

    if (!(await haveConversation(supabase, helper_ref, employerRef))) {
      return res.status(403).json({ error: 'You have no conversation with this family.' });
    }

    const result = await recordHireConfirmation(supabase, {
      helperRef: helper_ref,
      employerRef,
      confirmedBy: 'helper',
    });
    if (!result.ok) return res.status(500).json({ error: result.error });

    // The button is also an answer to "what happened?" — keep the two
    // records in step so the outcome table does not undercount hires that
    // came in through the original path.
    const { error: outcomeErr } = await supabase.from('hiring_outcomes').insert({
      reported_by: 'helper',
      helper_ref,
      employer_ref: employerRef,
      outcome: 'hired_here',
      trigger: 'conversation_prompt',
    });
    if (outcomeErr) console.warn('hiring_outcomes insert failed:', outcomeErr.message);

    return res.status(200).json({ ok: true, alreadyConfirmed: !!result.alreadyConfirmed });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
