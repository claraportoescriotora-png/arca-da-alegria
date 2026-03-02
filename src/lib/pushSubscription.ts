import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Base64 url safe string into Uint8Array
 */
function urlB64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Este browser não suporta notificações de desktop');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

export async function subscribeToPushNotifications(userId: string) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscribe the user
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        // Save subscription to the database
        await saveSubscriptionToDatabase(userId, subscription);
        return true;
    } catch (err) {
        console.error('Failed to subscribe to push notifications', err);
        return false;
    }
}

async function saveSubscriptionToDatabase(userId: string, subscription: PushSubscription) {
    try {
        const subJson = subscription.toJSON();

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                id: subJson.endpoint, // Use endpoint as unique ID to avoid duplicates per device
                user_id: userId,
                subscription: subJson
            }, { onConflict: 'id' });

        if (error) {
            console.error('Error saving push subscription:', error);
        }
    } catch (err) {
        console.error('Failed to save subscription', err);
    }
}
