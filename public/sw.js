// Service Worker pour Toujours Vivant (PWA)
const CACHE_NAME = 'toujours-vivant-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch Listener - CRITICAL: Never intercept API calls, Next.js internal routes, or dev server HMR
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER intercept /api/ routes
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. NEVER intercept Next.js static, HMR, or dev assets
  if (url.pathname.startsWith('/_next/') || url.pathname.includes('webpack') || url.pathname.includes('hmr')) {
    return;
  }

  // 3. For GET navigation requests only, try network first
  if (event.request.method === 'GET' && event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Toujours Vivant • Rappel Check-in';
  const options = {
    body: data.body || 'Votre chronomètre de sécurité nécessite un check-in en 1 tap.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
