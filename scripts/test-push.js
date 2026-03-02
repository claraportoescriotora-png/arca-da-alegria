import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Carrega as chaves do .env manualmente para esse teste
const envPath = path.resolve('.env');
const envFile = fs.readFileSync(envPath, 'utf8');

const getEnvParam = (param) => {
    const regex = new RegExp(`${param}=(.*)`);
    const match = envFile.match(regex);
    return match ? match[1].trim() : null;
};

const VAPID_PUBLIC = getEnvParam('VITE_VAPID_PUBLIC_KEY');
const VAPID_PRIVATE = getEnvParam('VITE_VAPID_PRIVATE_KEY');

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error('Chaves VAPID não encontradas no .env');
    process.exit(1);
}

// Configura o Web Push com as chaves
webpush.setVapidDetails(
    'mailto:contato@exemplo.com',
    VAPID_PUBLIC,
    VAPID_PRIVATE
);

// EXEMPLO DE PAYLOAD (Mude de acordo com os campos salvos no supabase `push_subscriptions` se for testar manualmente)
const pushSubscription = {
    // Insira a URL e keys recebidas pelo navegador do usuário.
    // Para testar isso, você precisa pegar a string json completa salva na tabela `push_subscriptions`.
    endpoint: 'https://fcm.googleapis.com/fcm/send/exemplo...',
    keys: {
        auth: '...',
        p256dh: '...'
    }
};

const payload = JSON.stringify({
    title: 'Nova Tarefinha!',
    body: 'Venha conferir a nova atividade de colorir!',
    url: '/activities'
});

console.log('Testando Envio de Push (Atenção: Adicione os dados válidos de subscription no código!)');
console.log('Você pode copiar o JSON diretamente do painel do Supabase da tabela push_subscriptions.');

/*
webpush.sendNotification(pushSubscription, payload)
    .then(result => console.log('Push enviado com sucesso!', result))
    .catch(err => console.error('Erro ao enviar push', err));
*/
