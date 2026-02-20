const CACHE_NAME = 'amiguitos-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/main.tsx',
    // Note: Vite hashes assets in production, so this sw.js is basic.
    // In a real production build, use workbox or vite-plugin-pwa.
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Pre-caching assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('SW: Service Worker activated');
});

// Fetch Event - Network First, falling back to cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If successful, clone it and put in cache
                const resClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    // Cache successful GET requests for common assets
                    if (event.request.method === 'GET' &&
                        (event.request.url.includes('/assets/') ||
                            event.request.url.includes('googleapis.com') ||
                            event.request.url.includes('supabase.co'))) {
                        cache.put(event.request, resClone);
                    }
                });
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
