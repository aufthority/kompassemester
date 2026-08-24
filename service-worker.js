// Kompas Semester — minimal service worker.
// Its only job is to satisfy the installability requirement
// (Chrome/Android will not offer an install prompt without a
// registered, fetch-handling service worker). It does not cache
// or intercept anything beyond a pass-through fetch, so the app
// always gets fresh data from Supabase and the network.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through only — no caching, no offline support.
  // (Add a cache strategy here later if offline support is wanted.)
  event.respondWith(fetch(event.request));
});
