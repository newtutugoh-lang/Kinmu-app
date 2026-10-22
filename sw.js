/* 勤務記録 Service Worker
   アプリを更新したら VERSION を変えてください（index.html の APP_VERSION も合わせる）。 */
const VERSION = '1.0.0';
const CACHE = 'kinmu-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './kinmu.html',
  './manifest.webmanifest',
  './exceljs.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kinmu-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // 画面の読み込み：キャッシュを優先（オフラインでも開ける）
    e.respondWith(
      caches.match(req, { ignoreSearch: true })
        .then((r) => r || caches.match('./index.html'))
        .then((r) => r || fetch(req))
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
