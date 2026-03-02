import webpush from 'web-push';
import fs from 'fs';

const vapidKeys = webpush.generateVAPIDKeys();

const envContent = `
VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VITE_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`;

fs.appendFileSync('.env', envContent);
console.log('Chaves VAPID geradas e salvas no .env!');
