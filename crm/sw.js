/* =========================================================
   Свой CRM — service worker: приложение открывается без интернета.
   После изменения файлов увеличьте номер версии в CACHE.
   ========================================================= */
const CACHE = 'svoy-crm-v3';

// Чужие адреса кэшируем только для шрифтов и Tailwind; запросы к серверу заявок идут мимо кэша
const CACHEABLE_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.tailwindcss.com'];
const CORE = [
  './',
  'index.html',
  'app.css',
  'app.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin && !CACHEABLE_HOSTS.includes(url.hostname)) return;

  // Страницы: сначала сеть, без интернета — сохранённая копия
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('index.html', copy));
          return response;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Скрипты, стили, шрифты, Tailwind: сразу из кэша, в фоне обновляем
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
