/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

// Precaching automatically injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
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
