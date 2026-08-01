const VERSION = 'vetta-v3.2.0';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const ROOT = new URL('./', self.location).href;
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './parts/ui-01.part',
  './parts/ui-02.part',
  './parts/ui-03.part',
  './parts/ui-04.part',
  './parts/app-01.part',
  './parts/app-02.part',
  './parts/app-03.part',
  './parts/app-04.part',
  './parts/app-05.part',
  './parts/app-06.part',
  './parts/app-07.part',
  './parts/app-08.part',
  './parts/app-09.part',
  './parts/patch-01.part',
  './parts/patch-02.part',
  './parts/patch-03.part',
  './parts/patch-04.part',
  './parts/patch-05.part'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![STATIC_CACHE, RUNTIME_CACHE].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then(cached => cached || caches.match(ROOT) || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => { const network = fetch(event.request).then(response => { if (response && response.ok) { const copy = response.clone(); caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy)); } return response; }); return cached || network; }));
});

self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
