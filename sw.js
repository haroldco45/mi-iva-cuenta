const CACHE = 'mi-iva-cuenta-v3';
const BASE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Red primero (para que siempre llegue lo nuevo), y si no hay señal, lo guardado.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).pathname.endsWith('.mp4')) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request.url.split('?')[0], copia));
      }
      return r;
    }).catch(() => caches.match(e.request.url.split('?')[0]).then(r => r || caches.match('index.html')))
  );
});
