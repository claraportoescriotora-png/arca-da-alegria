
const CACHE_NAME = 'amiguitos-v6'; // v6: Fix YouTube thumbnails on Safari

// Asset types to cache
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg'
];

// ... (install/activate same)

// Fetch Event
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Bypass Dynamic Auth & API Routes
    if (
        url.pathname.includes('/auth/') ||
        url.pathname.includes('/api/') ||
        url.hostname.includes('supabase.co') ||
        event.request.method !== 'GET'
    ) {
        return; // Always network
    }

    // Bypass SW for all external media to avoid opaque response caching issues in PWA
    const isExternalMedia =
        url.hostname.includes('ytimg.com') ||
        url.hostname.includes('youtube.com') || // Covers img.youtube.com
        url.hostname.includes('unsplash.com') ||
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('googleusercontent.com');

    if (isExternalMedia) {
        return; // Let browser handle natively
    }

    // 2. Cache-First Strategy for Images and Assets
    const isImage = event.request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp)$/.test(url.pathname) || url.hostname.includes('googleapis.com');
    const isFont = event.request.destination === 'font' || url.hostname.includes('gstatic.com');

    if (isImage || isFont) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('SW: Cache hit for', url.pathname);
                    return cachedResponse;
                }

                console.log('SW: Cache miss for', url.pathname, '- Fetching from network');
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                        return response;
                    }
                    if (url.protocol === 'http:' || url.protocol === 'https:') {
                        const resClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
                    }
                    return response;
                }).catch((err) => {
                    console.error('SW: Fetch error for image/font', url.pathname, err);
                    // Return a 404 for missing images rather than a network error, helping the app's onError triggers
                    return new Response('', { status: 404 });
                });
            })
        );
        return;
    }

    // 3. Network First falling back to Cache for everything else (Scripts, Pages)
    // This ensures latest JS versions are used but works offline
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache valid GET responses
                if (response.status === 200 && event.request.method === 'GET') {
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
                }
                return response;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;

                // CRITICAL FIX: Don't return a string body for scripts/pages as it breaks execution
                // Only return the custom error for direct page navigations, otherwise let it fail
                if (event.request.mode === 'navigate') {
                    return new Response(
                        '<html><body><div style="padding:20px;text-align:center;font-family:sans-serif;">' +
                        '<h2>Ops! Sem conexão.</h2><p>Verifique sua internet e tente novamente.</p>' +
                        '<button onclick="window.location.reload()">Recarregar</button></div></body></html>',
                        { headers: { 'Content-Type': 'text/html' } }
                    );
                }

                // For scripts/data, returning the default error status is better than a custom string body
                return new Response(null, {
                    status: 503,
                    statusText: 'Service Unavailable (Offline)'
                });
            })
    );
});
