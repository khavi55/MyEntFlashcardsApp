const CACHE_NAME = 'ent-flashcards-v1';
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

  // Let Google Apps Script bypass service worker cache
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
        // If it's a valid network response, check if it's a GitHub image or core asset
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !requestUrl.includes('raw.githubusercontent.com')) {
          return networkResponse;
        }

        // Clone the response because it's a stream and can only be consumed once
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Optional fallback if both cache and network fail
        return new Response("Offline and resource not cached.");
      });
    })
  );
});