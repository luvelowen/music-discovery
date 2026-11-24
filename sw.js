/**
 * Lets the site open without internet once it has been visited.
 * It keeps copies of the site's own files only. It never sees, stores or sends a card:
 * cards live after the # in links and in the page's own storage.
 */
const CACHE = 'mixtape-v0.4.0';
const FILES = [
  './', 'index.html', 'style.css', 'fonts.css', 'app.js', 'card.js', 'data.js', 'i18n.js', 'story.js',
  'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'photos/ub-night.jpg',
  'fonts/manrope-latin.woff2', 'fonts/manrope-latin-ext.woff2', 'fonts/manrope-cyrillic.woff2', 'fonts/manrope-cyrillic-ext.woff2',
  'fonts/montserrat-latin.woff2', 'fonts/montserrat-latin-ext.woff2', 'fonts/montserrat-cyrillic.woff2', 'fonts/montserrat-cyrillic-ext.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Fresh files when online, saved copies when offline. Only this site's own files, only GET.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }).then((saved) => saved ?? caches.match('index.html'))),
  );
});
