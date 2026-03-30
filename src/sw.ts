/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

// Service Worker Version: 1.0.2 (Force update to clear landing flicker cache)
const SW_VERSION = '1.0.2';

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

// Precaching automatically injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', (event) => {
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Ensure the new service worker takes control of all pages immediately.
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Clear old caches if version changes (Workbox handles most of this, but we can be explicit)
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== 'workbox-precache-v2' && !cacheName.includes(SW_VERSION)) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const title = data.title || 'Arca da Alegria';
        const options: NotificationOptions = {
            body: data.body || '',
            icon: data.icon || 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp',
            badge: data.badge || 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp',
            data: data.url ? { url: data.url } : undefined,
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
        console.error('Push event payload was not JSON format', err);
        // Fallback if not stringified JSON
        event.waitUntil(
            self.registration.showNotification('Arca da Alegria', {
                body: event.data.text(),
                icon: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp'
            })
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                // Find a matching client to focus it
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If no matching client, open a new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow(event.notification.data.url);
                }
            })
        );
    }
});
