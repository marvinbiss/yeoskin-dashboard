/**
 * Yeoskin Dashboard Service Worker
 *
 * Provides offline support, caching, and background sync.
 */

const CACHE_NAME = 'yeoskin-v1'
const STATIC_CACHE = 'yeoskin-static-v1'
const DYNAMIC_CACHE = 'yeoskin-dynamic-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // Claim all clients immediately
  self.clients.claim()
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API requests - always fetch from network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      })
    )
    return
  }

  // Skip Supabase requests
  if (url.hostname.includes('supabase')) return

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Return cached page or offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline.html')
          })
        })
    )
    return
  }

  // Handle static assets (CSS, JS, images)
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cache and update in background
          fetch(request).then((response) => {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, response)
            })
          })
          return cached
        }
        // Fetch and cache
        return fetch(request).then((response) => {
          const responseClone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
      })
    )
    return
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone()
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone)
        })
        return response
      })
      .catch(() => caches.match(request))
  )
})

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  // Get queued requests from IndexedDB and retry
  console.log('[SW] Background sync triggered')
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nouvelle notification Yeoskin',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: 'explore', title: 'Voir les détails' },
      { action: 'close', title: 'Fermer' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification('Yeoskin Dashboard', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'))
  }
})

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})
