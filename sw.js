const CACHE = 'timecon-v32';
const ASSETS = ['./', 'index.html', 'fonts.css?v=32', 'styles.css?v=32', 'supabase.js?v=32', 'config.js?v=32', 'icons.js?v=32', 'i18n.js?v=32', 'app.js?v=32', 'manifest.webmanifest', 'icon.svg', 'icon-64.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'favicon-32.png', 'fonts/clash-grotesk-400.woff2', 'fonts/clash-grotesk-500.woff2', 'fonts/clash-grotesk-600.woff2', 'fonts/clash-grotesk-700.woff2'];

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
