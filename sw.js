const CACHE_NAME = 'neural-pos-farmacia-v1-pwa';
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/main.css',
  './core/constants.js',
  './core/storage.js',
  './core/state.js',
  './core/utils.js',
  './core/data.js',
  './core/auth.js',
  './core/app.js',
  './modules/dashboard/index.js',
  './modules/ventas/index.js',
  './modules/inventario/index.js',
  './modules/bodega/index.js',
  './modules/users/index.js',
  './modules/clientes/index.js',
  './modules/historial/index.js',
  './modules/reportes/index.js',
  './modules/configuracion/index.js',
  './modules/mayoreo_dashboard/index.js',
  './modules/mayoreo_ventas/index.js',
  './modules/mayoreo_inventario/index.js',
  './modules/mayoreo_clientes/index.js',
  './modules/mayoreo_historial/index.js',
  './modules/mayoreo_reportes/index.js',
  './modules/web/index.js',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
