// POST   /api/push/subscribe   — Save a PushSubscription for the logged-in user
// DELETE /api/push/subscribe   — Remove a subscription by endpoint (on unsubscribe)
//
// Works for both helpers (th_session cookie) and employers (th_emp_session).
// A single user can have multiple subscriptions (one per device/browser).

import { getAnySession } from '../../../lib/auth';
import { getServiceSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const session = await getAnySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();

  // ─── POST — save subscription ──────────────────────────────────────────
  if (req.method === 'POST') {
    const { subscription } = req.body || {};
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription payload' });
    }
    const { endpoint } = subscription;
    const p256dh = subscription.keys.p256dh;
    const authSecret = subscription.keys.auth;
    if (!p256dh || !authSecret) {
      return res.status(400).json({ error: 'Missing subscription keys' });
    }

    // Truncate user-agent defensively (some browsers send huge UA strings)
    const userAgent = (req.headers['user-agent'] || '').slice(0, 500) || null;

    // Upsert on endpoint — if the same device re-subscribes (e.g. after
    // permission reset) we replace the row instead of creating a duplicate.
    // Endpoint is UNIQUE in the schema.
    const payload = {
      user_role: session.role,
      user_ref: session.ref,
      endpoint,
      p256dh,
      auth_secret: authSecret,
      user_agent: userAgent,
    };
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' });

    if (error) {
      console.error('[push/subscribe] Upsert failed:', error);
      // Surface the real supabase error to the client while we're
      // debugging. This is authenticated-only, so leakage risk is low.
      return res.status(500).json({
        error: 'Failed to save subscription',
        debug: {
          message: error.message,
          details: error.details || null,
          hint: error.hint || null,
          code: error.code || null,
          session_role: session.role,
          session_ref_type: typeof session.ref,
          session_ref_sample: typeof session.ref === 'string' ? session.ref.slice(0, 8) + '...' : null,
        },
      });
    }

    return res.status(200).json({ ok: true });
  }

  // ─── DELETE — remove subscription ──────────────────────────────────────
  if (req.method === 'DELETE') {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint required' });
    }
    // Scoped to this user — you can't unsubscribe someone else's device.
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_role', session.role)
      .eq('user_ref', session.ref);

    if (error) {
      console.error('[push/subscribe] Delete failed:', error.message);
      return res.status(500).json({ error: 'Failed to remove subscription' });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
