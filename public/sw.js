// ThaiHelper Service Worker
// - Offline fallback for navigations (network-first)
// - Web Push notifications (new-message alerts for helpers & employers)
// Bumping CACHE_VERSION invalidates the offline shell on next visit.
const CACHE_VERSION = 'th-v2';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Network-first for page navigations, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});

// ─── Web Push ─────────────────────────────────────────────────────────────
// Server sends a JSON payload:
//   { title, body, url?, conversationId? }
// We display a notification and, on click, focus an existing tab (if any)
// at that URL or open a new one.

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // If the server sent plain text, use it as the body
    payload = { title: 'ThaiHelper', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'ThaiHelper';
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.conversationId ? `msg-${payload.conversationId}` : 'thaihelper',
    // renotify=true means subsequent messages in the same conversation
    // still vibrate/alert instead of silently replacing the old banner.
    renotify: true,
    data: {
      url: payload.url || '/profile?tab=messages',
      conversationId: payload.conversationId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/profile?tab=messages';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a ThaiHelper tab is already open, focus it and navigate there
        for (const client of clientList) {
          try {
            const url = new URL(client.url);
            if (url.origin === self.location.origin && 'focus' in client) {
              client.navigate(target);
              return client.focus();
            }
          } catch {
            // ignore malformed URLs
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(target);
        }
        return null;
      }),
  );
});
