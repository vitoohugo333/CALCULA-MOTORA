const VERSION = 'vetta-v3.4.2';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const ROOT = new URL('./', self.location).href;
const RELEASE = '3.4.2';
const versioned = file => `${file}?v=${RELEASE}`;
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  versioned('./app.js'),
  './manifest.webmanifest',
  './icon.svg',
  versioned('./parts/ui-01.part'),
  versioned('./parts/ui-02.part'),
  versioned('./parts/ui-03.part'),
  versioned('./parts/ui-04.part'),
  versioned('./parts/app-01.part'),
  versioned('./parts/app-02.part'),
  versioned('./parts/app-03.part'),
  versioned('./parts/app-04.part'),
  versioned('./parts/app-05.part'),
  versioned('./parts/app-06.part'),
  versioned('./parts/app-07.part'),
  versioned('./parts/app-08.part'),
  versioned('./parts/app-09.part'),
  versioned('./parts/patch-01.part'),
  versioned('./parts/patch-02.part'),
  versioned('./parts/patch-03.part'),
  versioned('./parts/patch-04.part'),
  versioned('./parts/patch-05.part'),
  versioned('./parts/patch-06.part'),
  versioned('./parts/patch-07.part'),
  versioned('./parts/patch-08.part')
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => ![STATIC_CACHE, RUNTIME_CACHE].includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match(ROOT) || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
      return cached || network;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
