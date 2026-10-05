// Service worker de BuzAstral.
// - Archivos propios: primero red (así las actualizaciones llegan al móvil) y, si no hay conexión, la copia guardada.
// - Fuentes y librería PDF (cdnjs): se guardan al usarlas online para que sigan disponibles después.
const CACHE_NAME = 'buzastral-cache-v1';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];
const EXTERNOS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) => Promise.all(nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then((res) => {
        const copia = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copia));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
  } else if (EXTERNOS.includes(url.hostname)) {
    event.respondWith(
      caches.match(req).then((cacheada) => {
        const red = fetch(req).then((res) => {
          const copia = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copia));
          return res;
        }).catch(() => cacheada);
        return cacheada || red;
      })
    );
  }
});
