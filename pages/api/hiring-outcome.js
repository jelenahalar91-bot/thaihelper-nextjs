// GET  /api/hiring-outcome?role=employer&counterparty=TH-XXXX
//        → what this user last said about this pair, and whether to ask again
// POST /api/hiring-outcome { role, outcome, counterpartyRef?, source?, sourceDetail?, trigger }
//        → record an answer to "what happened?"
//
// Works for both roles; `role` picks the cookie (lib/auth.js getAnySession).
//
// Why this exists: of 149 conversations that became a real multi-day
// exchange, 125 ended without the platform ever learning the result. Two
// moments are good for asking — when someone switches their profile to
// paused / hidden / working, and under a conversation that has clearly
// become serious. Both post here. See scripts/supabase-hiring-outcomes.sql
// for the vocabulary.
//
// Nothing here can verify an answer. The guards are about not letting the
// endpoint name people the speaker never met, and not letting it become a
// way to spam the other side: the only email that can result is the
// existing one-per-pair review request, and only when a helper says
// hired_here (lib/hire-confirmation.js).

import { getAnySession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { recordHireConfirmation, haveConversation } from '../../lib/hire-confirmation';
import { checkRateLimit } from '../../lib/rate-limit';

const OUTCOMES = ['hired_here', 'hired_elsewhere', 'not_a_match', 'still_talking', 'stopped_looking'];
const SOURCES = ['agency', 'facebook', 'friends', 'other'];
const TRIGGERS = ['status_change', 'conversation_prompt'];

// Outcomes that are a statement about one specific counterparty. hired_here
// is not in the list: a family may have found someone here without that
// person appearing in their conversations (shared browser, deleted thread),
// and "we hired on ThaiHelper, can't say who" is still worth a row — just
// not a hire_confirmations row.
const PAIR_OUTCOMES = ['not_a_match', 'still_talking'];

// "Still talking" is a snooze, not an answer. After this long the strip
// under the conversation asks again.
const STILL_TALKING_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const REF_RE = /^(TH|EMP)-[A-Z0-9]{4,10}$/;

export default async function handler(req, res) {
  const session = await getAnySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const role = session.role; // 'employer' | 'helper'
  const myRef = session.ref;
  const ownColumn = role === 'employer' ? 'employer_ref' : 'helper_ref';
  const otherColumn = role === 'employer' ? 'helper_ref' : 'employer_ref';

  if (req.method === 'GET') {
    const counterparty = String(req.query.counterparty || '').trim().toUpperCase();
    if (!REF_RE.test(counterparty)) return res.status(400).json({ error: 'counterparty required' });

    const { data } = await supabase
      .from('hiring_outcomes')
      .select('outcome, created_at')
      .eq('reported_by', role)
      .eq(ownColumn, myRef)
      .eq(otherColumn, counterparty)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let askAgain = true;
    if (data) {
      askAgain = data.outcome === 'still_talking'
        && Date.now() - new Date(data.created_at).getTime() > STILL_TALKING_SNOOZE_MS;
    }

    return res.status(200).json({
      outcome: data?.outcome || null,
      reportedAt: data?.created_at || null,
      askAgain,
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const outcome = String(body.outcome || '');
    const trigger = String(body.trigger || '');
    const counterpartyRef = body.counterpartyRef
      ? String(body.counterpartyRef).trim().toUpperCase()
      : null;
    const source = body.source ? String(body.source) : null;
    const sourceDetail = body.sourceDetail
      ? String(body.sourceDetail).replace(/\s+/g, ' ').trim().slice(0, 120)
      : null;

    if (!OUTCOMES.includes(outcome)) return res.status(400).json({ error: 'Invalid outcome' });
    if (!TRIGGERS.includes(trigger)) return res.status(400).json({ error: 'Invalid trigger' });
    if (source && !SOURCES.includes(source)) return res.status(400).json({ error: 'Invalid source' });
    if (counterpartyRef && !REF_RE.test(counterpartyRef)) {
      return res.status(400).json({ error: 'Invalid counterparty' });
    }
    if (PAIR_OUTCOMES.includes(outcome) && !counterpartyRef) {
      return res.status(400).json({ error: 'counterpartyRef required for this outcome' });
    }

    // A prompt that can be answered repeatedly is a prompt that can be
    // scripted. Nobody answers "what happened?" thirty times an hour.
    const withinRate = await checkRateLimit({
      bucket: 'hiring-outcome',
      key: `${role}:${myRef}`,
      max: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!withinRate) return res.status(429).json({ error: 'Too many requests' });

    if (counterpartyRef) {
      const helperRef = role === 'employer' ? counterpartyRef : myRef;
      const employerRef = role === 'employer' ? myRef : counterpartyRef;
      if (!(await haveConversation(supabase, helperRef, employerRef))) {
        return res.status(403).json({ error: 'You have no conversation with this person.' });
      }
    }

    const row = {
      reported_by: role,
      [ownColumn]: myRef,
      [otherColumn]: counterpartyRef,
      outcome,
      source: outcome === 'hired_elsewhere' ? source : null,
      source_detail: outcome === 'hired_elsewhere' ? sourceDetail : null,
      trigger,
    };

    const { error } = await supabase.from('hiring_outcomes').insert(row);
    if (error) {
      console.error('hiring_outcomes insert error:', error);
      return res.status(500).json({ error: 'Could not save that. Please try again.' });
    }

    // A hire named with a counterparty is the same fact hire_confirmations
    // has always recorded; write it there too so the hire rate stays one
    // query. The helper's version also sends the one-per-pair review
    // request to the family; the family's version sends nothing.
    if (outcome === 'hired_here' && counterpartyRef) {
      const helperRef = role === 'employer' ? counterpartyRef : myRef;
      const employerRef = role === 'employer' ? myRef : counterpartyRef;
      await recordHireConfirmation(supabase, { helperRef, employerRef, confirmedBy: role });
    }

    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
