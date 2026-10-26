// SafeBand / SmartCalc Service Worker with Offline Caching & Background Sync
const CACHE_NAME = 'safeband-cache-v2';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background Sync for offline SOS flush
self.addEventListener('sync', (event) => {
  if (event.tag === 'safeband-flush-sos') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_FLUSH_SOS' });
        });
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  // Never intercept WebSocket or API calls
  if (event.request.url.includes('/api/') || event.request.url.startsWith('ws:') || event.request.url.startsWith('wss:')) {
    return;
  }

  // Navigation requests fall back to index.html for SPA routing
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        // Cache static assets dynamically
        if (
          event.request.url.includes('/assets/') ||
          event.request.url.includes('fonts.googleapis') ||
          event.request.url.includes('fonts.gstatic')
        ) {
          const clone = fetchRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return fetchRes;
      }).catch(() => {
        return caches.match(event.request);
      });
    })
  );
});
