// Carnes & Sons Installer — service worker. Same mechanism as the Office Console: installable +
// offline shell; network-first with cache:"no-store" so the field app is always current when online,
// and it WAITS on a new version so the page can show an "Update now" banner (no silent stale code).
var V = '1.0.1';
var CACHE = 'csinstaller-' + V;
var CORE = ['index.html', 'manifest.webmanifest', 'inst-icon-192.png', 'inst-icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE).catch(function () {}); }));
});
self.addEventListener('message', function (e) { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  if (u.origin !== location.origin) return;        // leave Supabase API calls alone
  e.respondWith(
    fetch(req, { cache: "no-store" }).then(function (r) {
      if (r && r.status === 200 && r.type === 'basic') { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
      return r;
    }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match('index.html'); }); })
  );
});