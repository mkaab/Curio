const CACHE_NAME = 'curio-cache-v2';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/assets/hero.png',
  '/assets/streetwear.png',
  '/assets/luxury.png'
];

// Install Event - Caches critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Cache-first for assets, network-first for pages
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip Supabase API/auth/realtime requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('supabase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Only cache static assets to prevent caching authenticated HTML pages
        const url = new URL(event.request.url);
        if (networkResponse && networkResponse.status === 200 && 
            (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|css|js)$/))) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline page or default behavior
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
