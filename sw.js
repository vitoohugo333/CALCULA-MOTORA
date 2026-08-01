const CACHE = 'vetta-v2-2026-08-01';
const ROOT = new URL('./', self.location).href;
const INDEX = new URL('index.html', ROOT).href;
const APP_SHELL = [
  ROOT,
  INDEX,
  new URL('app.js', ROOT).href,
  new URL('styles.css', ROOT).href,
  new URL('manifest.webmanifest', ROOT).href,
  new URL('icon.svg', ROOT).href
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => {
            cache.put(request, copy);
            cache.put(INDEX, response.clone());
          });
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(INDEX)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
