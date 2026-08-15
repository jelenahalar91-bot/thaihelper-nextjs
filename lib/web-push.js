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

// The native app stores its Expo push token in the same push_subscriptions
// table: endpoint = the Expo token, p256dh/auth_secret = the literal string
// 'expo' (both columns are NOT NULL). Expo tokens are routed to Expo's push
// API instead of the Web Push protocol.
function isExpoEndpoint(endpoint) {
  return (
    endpoint.startsWith('ExponentPushToken[') ||
    endpoint.startsWith('ExpoPushToken[')
  );
}

// Send to Expo's push service (native app devices). No VAPID involved —
// Expo relays to APNs/FCM. Returns ids partitioned like the web path:
// DeviceNotRegistered tickets mark the row dead for cleanup.
async function sendExpoPush(expoSubs, payload) {
  const liveIds = [];
  const deadIds = [];
  const messages = expoSubs.map((sub) => ({
    to: sub.endpoint,
    title: payload.title,
    body: payload.body,
    data: { url: payload.url, conversationId: payload.conversationId },
    sound: 'default',
  }));
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const json = await res.json();
    const tickets = Array.isArray(json?.data) ? json.data : [];
    tickets.forEach((ticket, i) => {
      if (!expoSubs[i]) return;
      if (ticket.status === 'ok') {
        liveIds.push(expoSubs[i].id);
      } else if (ticket.details?.error === 'DeviceNotRegistered') {
        deadIds.push(expoSubs[i].id);
      } else {
        console.error('[expo-push] Ticket error:', ticket.message || ticket);
      }
    });
  } catch (err) {
    console.error('[expo-push] Send failed:', err?.message || err);
  }
  return { liveIds, deadIds };
}

/**
 * Send a push notification to all devices a user has subscribed —
 * web-push (PWA/browser) and Expo (native app) subscriptions alike.
 *
 * @param {'helper'|'employer'} userRole
 * @param {string} userRef  - UUID
 * @param {object} payload  - { title, body, url?, conversationId? }
 * @returns {Promise<{ sent: number, dead: number }>}
 */
export async function sendPushToUser(userRole, userRef, payload) {
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

  const webSubs = subs.filter((sub) => !isExpoEndpoint(sub.endpoint));
  const expoSubs = subs.filter((sub) => isExpoEndpoint(sub.endpoint));

  const body = JSON.stringify(payload);
  const deadIds = [];
  const liveIds = [];

  if (webSubs.length > 0 && !configureVapidOnce()) {
    console.warn('[web-push] VAPID keys not configured — web push skipped');
  } else {
    await Promise.all(
      webSubs.map(async (sub) => {
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
  }

  if (expoSubs.length > 0) {
    const expoResult = await sendExpoPush(expoSubs, payload);
    liveIds.push(...expoResult.liveIds);
    deadIds.push(...expoResult.deadIds);
  }

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
