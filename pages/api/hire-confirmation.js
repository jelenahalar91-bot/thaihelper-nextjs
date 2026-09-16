// GET  /api/hire-confirmation?employer=EMP-XXXX → has this helper already said yes?
// POST /api/hire-confirmation { employerRef }   → record it + email the family once
//
// Helper-session only. This is the helper's half of the review loop: hiring
// happens off-platform, so nothing in the schema ever knew a job had started
// — which is why three and a half months produced three reviews. A helper who
// got the job presses one button, and the family gets one email asking them
// to say how it went.
//
// Guards against this becoming a way to pester families:
//   - the two must actually have a conversation here,
//   - UNIQUE(helper_ref, employer_ref) means one email per pair, ever,
//   - the family's notify_on_message opt-out is honoured.

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { sendHireConfirmedEmail } from '../../lib/emails/hire-confirmation';
import { createUnsubscribeToken, buildUnsubscribeUrl } from '../../lib/unsubscribe';

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

    // They have to have talked. Not proof of a job — nothing here can be —
    // but it stops the button from reaching a family the helper never met.
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq('helper_ref', helper_ref)
      .eq('employer_id', employerRef)
      .limit(1);

    if (!convs || convs.length === 0) {
      return res.status(403).json({ error: 'You have no conversation with this family.' });
    }

    // Insert first, mail second. If the insert loses the race the row already
    // exists and we stop — better a missing email than a family told twice.
    const { data: inserted, error } = await supabase
      .from('hire_confirmations')
      .insert({ helper_ref, employer_ref: employerRef, confirmed_by: 'helper' })
      .select()
      .maybeSingle();

    if (error) {
      // 23505 = unique violation: they already pressed it.
      if (error.code === '23505') {
        return res.status(200).json({ ok: true, alreadyConfirmed: true });
      }
      console.error('Hire confirmation insert error:', error);
      return res.status(500).json({ error: 'Could not save that. Please try again.' });
    }

    const [{ data: employer }, { data: helper }] = await Promise.all([
      supabase
        .from('employer_accounts')
        .select('first_name, email, notify_on_message')
        .eq('employer_ref', employerRef)
        .single(),
      supabase
        .from('helper_profiles')
        .select('first_name')
        .eq('helper_ref', helper_ref)
        .single(),
    ]);

    if (employer?.email && employer.notify_on_message !== false) {
      try {
        const token = await createUnsubscribeToken('employer', employerRef);
        await sendHireConfirmedEmail({
          employerName: employer.first_name,
          employerEmail: employer.email,
          helperName: helper?.first_name,
          unsubscribeUrl: buildUnsubscribeUrl(token),
        });
        await supabase
          .from('hire_confirmations')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', inserted.id);
      } catch (err) {
        // The confirmation itself stands — it is real data about a real hire
        // either way, and notified_at staying null is how we find the ones
        // that never went out.
        console.error('Hire confirmation email failed:', err.message);
      }
    }

    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
