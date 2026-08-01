const CACHE_NAME = 'ent-flashcards-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event: Caching the core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches if you update the app later
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

// Fetch Event: Serve cached files when offline & auto-cache GitHub images
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;

  // Let Google Apps Script requests bypass the service worker cache 
  if (requestUrl.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If found in cache, return it immediately (works completely offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from the network
      return fetch(event.request).then((networkResponse) => {
        // Accept status 200 (standard local/same-origin) or status 0 (opaque cross-origin like GitHub raw)
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
          return networkResponse;
        }

        // Clone the response because it's a stream and can only be consumed once
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback if both cache and network fail
        return new Response("Offline and resource not cached.", {
          status: 503,
          statusText: "Service Unavailable"
        });
      });
    })
  );
});
