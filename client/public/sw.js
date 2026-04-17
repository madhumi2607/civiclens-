// CivicLens Service Worker
const CACHE_NAME = 'civiclens-v1'

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
]

// ── Install: pre-cache shell assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first for API, cache-first for static assets ───────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Bypass cache for API calls and non-GET requests
  if (request.method !== 'GET' || url.pathname.startsWith('/api')) {
    return
  }

  // Network-first for HTML navigation (always fresh shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
    return
  }

  // Cache-first for everything else (JS, CSS, images, tiles served from CDN)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        // Only cache same-origin or OSM tile responses
        if (
          response.ok &&
          (url.origin === self.location.origin ||
            url.hostname.endsWith('tile.openstreetmap.org'))
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
