// Fetch Event - Network First, falling back to cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Check if we received a valid, full response (status 200)
                // Note: Partial content (status 206) is not supported by the Cache API
                if (response.status === 200) {
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        // Cache common assets from known sources
                        const url = event.request.url;
                        const isCachable = event.request.method === 'GET' && (
                            url.includes('/assets/') ||
                            url.includes('googleapis.com') ||
                            url.includes('gstatic.com') ||
                            url.includes('supabase.co')
                        );

                        if (isCachable) {
                            cache.put(event.request, resClone);
                        }
                    });
                }
                return response;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;

                console.log('SW: Fetch failed for:', event.request.url);
                return new Response('Network error occurred', {
                    status: 408,
                    statusText: 'Network error occurred',
                });
            })
    );
});
