import { precacheAndRoute } from 'workbox-precaching';

// Inject workbox precache manifest
precacheAndRoute(self.__WB_MANIFEST || []);

// Forces the waiting service worker to become the active service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Push Notifications
self.addEventListener('push', function (event) {
  console.log('[SW] Push event received!', event);
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [100, 50, 100],
        data: {
          url: data.url || '/'
        }
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      // Fallback if not JSON
      event.waitUntil(
        self.registration.showNotification('Habit Reminder', { 
          body: event.data.text(),
          icon: '/pwa-192x192.png' 
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // If a window is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});

// Handle Subscription changes (e.g. browser expires the token)
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[SW] Push subscription expired or changed.');
  // The frontend handles refreshing by sending the new sub to Firestore
  // We notify clients to re-subscribe if they are open
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
      });
    })
  );
});
