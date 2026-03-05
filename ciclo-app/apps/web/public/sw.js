// Service Worker — Ciclo das Estacoes PWA
// Manual implementation (no next-pwa, no workbox)
// Cache strategies: CacheFirst (static + QR), NetworkFirst (API + navigation)

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `ciclo-${CACHE_VERSION}-static`;
const API_CACHE = `ciclo-${CACHE_VERSION}-api`;

const APP_SHELL = [
  '/',
  '/eventos',
  '/minha-conta/inscricoes',
  '/offline',
  '/manifest.json',
];

// ──────────────────────────────────────────
// INSTALL — cache app shell
// ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ──────────────────────────────────────────
// ACTIVATE — clean old caches
// ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, API_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('ciclo-') && !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  // Claim all clients so the new SW takes effect immediately
  self.clients.claim();
});

// ──────────────────────────────────────────
// FETCH — routing strategies
// ──────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // ── QR Code API: CacheFirst (AC-5) ──
  if (url.pathname.match(/^\/api\/registrations\/[^/]+\/qrcode/)) {
    event.respondWith(cacheFirst(request, API_CACHE));
    return;
  }

  // ── Event schedule API: NetworkFirst (AC-6) ──
  if (url.pathname.match(/^\/api\/events\/[^/]+\/schedule/)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // ── Static assets (.js, .css, images, fonts): CacheFirst ──
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Navigation requests: NetworkFirst with /offline fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // ── Default: NetworkFirst ──
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// ──────────────────────────────────────────
// STRATEGIES
// ──────────────────────────────────────────

/**
 * CacheFirst: return cached response if available, otherwise fetch and cache.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * NetworkFirst: try network, fall back to cache.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Navigation handler: NetworkFirst with /offline fallback page.
 */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Fallback to offline page
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    return new Response(
      '<html><body><h1>Sem conexao</h1><p>Voce esta offline.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

/**
 * Check if a pathname points to a static asset.
 */
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/i.test(pathname);
}
