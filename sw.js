/* Crease Log — offline service worker (added 2026-09-12)
   Network-falling-back-to-cache: every GET request is tried over the network
   first (so the app always gets the freshest copy when online), and the
   response is cached as it goes by. When the network is unavailable, the
   most recent cached copy is served instead — this is what lets an
   installed (Add to Home Screen) copy keep working with no internet after
   the first successful load. Covers the app's own HTML as well as the
   cross-origin Google Fonts CSS/font-file requests it makes.
   See STATUS.md for the full writeup. */

var CACHE_NAME = 'crease-log-v1';

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (n) { return n !== CACHE_NAME; })
          .map(function (n) { return caches.delete(n); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(event.request, copy);
      }).catch(function () { /* opaque/cross-origin responses can still be cached; ignore any failure */ });
      return response;
    }).catch(function () {
      return caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('./');
        }
      });
    })
  );
});
