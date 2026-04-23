/**
 * Server-side Web Push helper.
 *
 * Sends push notifications to a user's subscribed devices using VAPID.
 * Called from API routes — primarily pages/api/messages.js after a new
 * message is inserted. Failures are logged but never thrown to the caller;
 * a failed push must NOT fail the user's API request.
 *
 * Dead subscriptions (410 Gone / 404 Not Found from the push service) are
 * removed from the database automatically — browsers revoke push endpoints
 * when the user uninstalls the PWA or disables notifications, and we don't
 * want to keep retrying them forever.
 */

import webpush from 'web-push';
import { getServiceSupabase } from './supabase';

let vapidConfigured = false;

function configureVapidOnce() {
  if (vapidConfigured) return true;
  const { NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return false;
  }
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
  vapidConfigured = true;
  return true;
}

/**
 * Send a push notification to all devices a user has subscribed.
 *
 * @param {'helper'|'employer'} userRole
 * @param {string} userRef  - UUID
 * @param {object} payload  - { title, body, url?, conversationId? }
 * @returns {Promise<{ sent: number, dead: number }>}
 */
export async function sendPushToUser(userRole, userRef, payload) {
  if (!configureVapidOnce()) {
    console.warn('[web-push] VAPID keys not configured — push send skipped');
    return { sent: 0, dead: 0 };
  }
  if (!userRole || !userRef) return { sent: 0, dead: 0 };

  const supabase = getServiceSupabase();
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_secret')
    .eq('user_role', userRole)
    .eq('user_ref', userRef);

  if (error) {
    console.error('[web-push] Subscription fetch failed:', error.message);
    return { sent: 0, dead: 0 };
  }
  if (!subs || subs.length === 0) return { sent: 0, dead: 0 };

  const body = JSON.stringify(payload);
  const deadIds = [];
  const liveIds = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_secret },
          },
          body,
          { TTL: 60 * 60 * 24 }, // 24h — push service drops it if user is offline longer
        );
        liveIds.push(sub.id);
      } catch (err) {
        // 410 Gone / 404 Not Found → subscription is permanently dead.
        // Anything else (network blip, 5xx from push service) → keep it.
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          deadIds.push(sub.id);
        } else {
          console.error(
            `[web-push] Send failed (${status || 'unknown'}):`,
            err?.body || err?.message || err,
          );
        }
      }
    }),
  );

  // Clean up dead subscriptions
  if (deadIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', deadIds);
  }

  // Bump last_used_at for live ones (best-effort, non-blocking)
  if (liveIds.length > 0) {
    supabase
      .from('push_subscriptions')
      .update({ last_used_at: new Date().toISOString() })
      .in('id', liveIds)
      .then(() => {})
      .catch(() => {});
  }

  return { sent: liveIds.length, dead: deadIds.length };
}
