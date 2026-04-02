const CACHE_VERSION = 'v1'
const CACHE_NAME = `deer-alert-${CACHE_VERSION}`

// URLs to cache on install
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Install event: cache app shell and tiles
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE)
    }).then(() => {
      self.skipWaiting()
    })
  )
})

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      self.clients.claim()
    })
  )
})

// Fetch event: network-first for app shell, cache-first for tiles
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Tile requests (map): cache-first, fallback to network
  if (url.hostname.includes('tile.openstreetmap.org') || 
      url.hostname.includes('tiles.') ||
      request.url.includes('.png')) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(response => {
          // Cache successful tile responses
          if (response && response.status === 200) {
            const cloned = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, cloned)
            })
          }
          return response
        }).catch(() => {
          // Offline: return a blank tile or cached version
          return caches.match(request)
        })
      })
    )
    return
  }

  // App shell (HTML, JS, CSS): network-first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200 && request.method === 'GET') {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, cloned)
          })
        }
        return response
      })
      .catch(() => {
        // Offline: return cached version or offline page
        return caches.match(request) || caches.match('/index.html')
      })
  )
})
