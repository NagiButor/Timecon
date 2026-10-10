const CACHE = 'timecon-v17';
const ASSETS = ['./', 'index.html', 'fonts.css?v=17', 'styles.css?v=17', 'config.js?v=17', 'icons.js?v=17', 'app.js?v=17', 'manifest.webmanifest', 'icon.svg', 'icon-64.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'favicon-32.png', 'intro1.jpg', 'intro2.jpg', 'fonts/clash-grotesk-400.woff2', 'fonts/clash-grotesk-500.woff2', 'fonts/clash-grotesk-600.woff2', 'fonts/clash-grotesk-700.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
