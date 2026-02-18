const CACHE_NAME = 'bhaskar-solar-v2.0.0';
const STATIC_CACHE = 'bhaskar-static-v2';
const DYNAMIC_CACHE = 'bhaskar-dynamic-v2';

const STATIC_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Cache failed:', err))
    );
});

// Fetch event - network first with cache fallback strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    event.respondWith(
        fetch(request)
            .then(networkResponse => {
                // Clone and cache the response
                if (networkResponse.ok) {
                    const responseClone = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => cache.put(request, responseClone));
                }
                return networkResponse;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return offline fallback for HTML pages
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Push notification handler
self.addEventListener('push', event => {
    console.log('[SW] Push received');
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Bhaskar Solar';
    const options = {
        body: data.body || 'New notification from Bhaskar Solar',
        icon: './icons/icon-192.svg',
        badge: './icons/icon-192.svg',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || './',
            timestamp: Date.now()
        },
        actions: [
            { action: 'view', title: 'View Details' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        tag: data.tag || 'default',
        renotify: true
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'view' || !event.action) {
        const url = event.notification.data?.url || './';
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then(windowClients => {
                    // Focus existing window if available
                    for (const client of windowClients) {
                        if (client.url === url && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Open new window
                    return clients.openWindow(url);
                })
        );
    }
});

// Background sync handler
self.addEventListener('sync', event => {
    console.log('[SW] Background sync:', event.tag);
    if (event.tag === 'sync-production-data') {
        event.waitUntil(syncProductionData());
    }
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

async function syncProductionData() {
    // Sync offline production data
    console.log('[SW] Syncing production data...');
}

async function syncMessages() {
    // Sync offline messages
    console.log('[SW] Syncing messages...');
}

// Message handler from main thread
self.addEventListener('message', event => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then(cache => cache.addAll(event.data.urls))
        );
    }
});

console.log('[SW] Service Worker loaded');
