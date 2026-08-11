// Mentor — Service Worker.
// v2: ignora requisições que não sejam GET same-origin.
// Motivo: o Firestore usa long-polling/streaming e POSTs para firestore.googleapis.com;
// interceptá-los (e tentar guardá-los em cache) quebra a sincronização em tempo real
// e o modo offline do próprio SDK. O cache continua servindo o app (HTML/JS/ícones).
const CACHE = 'mentor-v2';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  // Deixa passar direto: Firebase, Google APIs, fontes e qualquer outra origem.
  if (!sameOrigin) return;

  // Network-first, cai para o cache quando offline.
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req))
  );
});
