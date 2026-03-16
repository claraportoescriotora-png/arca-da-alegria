
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

// Combined Configuration
export const config = {
    runtime: 'nodejs',
};

// --- Email Logic (Merged from lib/resend to avoid path issues on production) ---
const PWA_INSTRUCTIONS = `
  <div style="margin-top: 24px; padding: 16px; background-color: #f0f4ff; border-radius: 8px; font-size: 14px; border: 1px dashed #4f46e5;">
    <p style="margin: 0 0 8px 0; font-weight: bold; color: #4338ca;">💡 Dica: Instale o App no seu telemóvel!</p>
    <p style="margin: 0;">Para uma experiência completa, abra este link no seu iPhone (Safari) ou Android (Chrome), clique no botão de <strong>Compartilhar</strong> e selecione <strong>"Adicionar à Tela de Início"</strong>.</p>
  </div>
`;

async function sendWelcomeEmail(email: string, magicLink: string) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY missing');
        return null;
    }
    const resend = new Resend(apiKey);
    return await resend.emails.send({
        from: 'Meu Amiguito <nao-responda@meuamiguito.com.br>',
        to: email,
        subject: 'Bem-vindo ao Meu Amiguito! ✨',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e7ff; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Meu Amiguito</h1>
                </div>
                <div style="padding: 24px; color: #1e1e1e; line-height: 1.6;">
                    <h2 style="color: #4338ca;">Olá!</h2>
                    <p>Sua assinatura foi confirmada com sucesso. Estamos muito felizes em ter você e sua família conosco!</p>
                    <p>Para confirmar seu e-mail e entrar no app pela primeira vez, clique no botão abaixo:</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${magicLink}" style="background-color: #eab308; color: #1e1b4b; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">Confirmar E-mail e Entrar</a>
                    </div>
                    ${PWA_INSTRUCTIONS}
                </div>
                <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
                    &copy; 2026 Arca da Alegria - Meu Amiguito
                </div>
            </div>
        `
    });
}

// --- Main Webhook Handler ---
export default async function handler(req: any, res: any) {
    // 1. Diagnostics (GET request to check if it's alive)
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'online',
            service: 'Kiwify Webhook',
            timestamp: new Date().toISOString()
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Essential Env Vars
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gypzrzsmxgjtkidznstd.supabase.co';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const internalSecret = process.env.INTERNAL_API_SECRET;
        const signatureSecret = process.env.KIWIFY_SIGNATURE_SECRET;
        const webhookToken = process.env.WEBHOOK_TOKEN;

        if (!supabaseServiceKey) {
            return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Body Parsing
        let payload = req.body;
        if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch (e) { /* silent */ }
        }

        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ error: 'Payload body is empty or invalid' });
        }

        // Bypass / Security Check
        const bypassKey = req.headers['x-test-bypass'];
        const urlToken = req.query?.token;
        const productKey = req.query?.p || payload.key;

        // Fetch valid URL token from database (extra protection layer)
        const { data: tokenConfig } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', 'webhook_token')
            .maybeSingle();

        const validUrlToken = tokenConfig?.value || process.env.WEBHOOK_TOKEN;
        const isUrlTokenValid = (urlToken === validUrlToken);
        const isBypass = (internalSecret && bypassKey === internalSecret);

        if (!isBypass) {
            // First check the URL protection token
            if (!isUrlTokenValid) {
                console.warn(`Webhook blocked: Invalid URL token (${urlToken})`);
                return res.status(401).json({ error: 'Unauthorized URL Token' });
            }

            // Determine which Signature Secret to use
            let targetSecret = signatureSecret; // Default fallback to env var

            if (productKey) {
                const { data: product } = await supabase
                    .from('products')
                    .select('webhook_secret')
                    .eq('webhook_key', productKey)
                    .maybeSingle();

                if (product?.webhook_secret) {
                    targetSecret = product.webhook_secret;
                }
            } else {
                // Main subscription - check app_config
                const { data: subSecretConfig } = await supabase
                    .from('app_config')
                    .select('value')
                    .eq('key', 'subscription_webhook_secret')
                    .maybeSingle();

                if (subSecretConfig?.value) {
                    targetSecret = subSecretConfig.value;
                }
            }

            // Verify Kiwify Signature
            const signature = req.headers['x-kiwify-signature'];
            if (signature && targetSecret) {
                const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
                const hmac = crypto.createHmac('sha256', targetSecret);
                hmac.update(rawBody);
                const expectedSignature = hmac.digest('hex');

                if (signature !== expectedSignature) {
                    console.error(`Webhook blocked: HMAC mismatch for secret ending in ...${targetSecret.slice(-4)}`);
                    return res.status(401).json({ error: 'Invalid HMAC Signature' });
                }
            } else if (!signature && targetSecret) {
                // If a secret is defined but no signature is provided, it's a security risk
                console.warn('Webhook blocked: Missing signature header while secret is defined');
                return res.status(401).json({ error: 'Missing HMAC Signature' });
            }
        }

        // Extract Customer Data
        const customer = payload.Customer || payload.customer || {};
        const email = (customer.email || payload.email || "").toLowerCase().trim();
        const fullName = customer.full_name || customer.name || payload.full_name || payload.name;

        if (!email) {
            return res.status(400).json({ error: 'No email found in payload' });
        }

        const orderStatus = payload.order_status || payload.status;
        const eventType = payload.webhook_event_type || payload.event_type || orderStatus;

        console.log(`Webhook Event: ${eventType} for ${email} (Bypass: ${!!isBypass})`);

        // A. Handle Successful Payments / Renewals
        if (orderStatus === 'paid' || eventType === 'order_approved' || eventType === 'subscription_renewed') {

            // Check if user exists
            const { data: authData } = await supabase.auth.admin.listUsers();
            let userId = authData?.users?.find(u => u.email === email)?.id;

            if (!userId) {
                console.log(`Creating user record for ${email}`);
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email,
                    email_confirm: true,
                    user_metadata: {
                        source: 'kiwify',
                        is_test: isBypass,
                        full_name: fullName // This is caught by the DB trigger
                    }
                });

                if (createError) {
                    console.error('Error creating user:', createError);
                    throw createError; // Throwing will trigger the 500 catch and return error to Kiwify
                } else if (newUser?.user) {
                    userId = newUser.user.id;
                    // Generate Login Link
                    const origin = payload.origin || 'https://www.meuamiguito.com.br';

                    // Determine if we are granting a specific product or main subscription
                    // The key can come from query param 'p' or body 'key'
                    const productKey = req.query?.p || payload.key;

                    const { data: linkData } = await supabase.auth.admin.generateLink({
                        type: 'magiclink',
                        email: email,
                        options: { redirectTo: `${origin}/welcome` }
                    });

                    if (linkData?.properties?.action_link) {
                        try {
                            await sendWelcomeEmail(email, linkData.properties.action_link);
                        } catch (e) {
                            console.error('Email failed but user created:', e);
                        }
                    }
                }
            }

            // Update Profile Status or Product Access
            if (userId) {
                const productKey = req.query?.p || payload.key;

                if (productKey) {
                    // Grant specific product access
                    console.log(`Granting product access for ${productKey} to ${userId}`);

                    // 1. Find product ID
                    const { data: product } = await supabase
                        .from('products')
                        .select('id')
                        .eq('webhook_key', productKey)
                        .maybeSingle();

                    if (product) {
                        await supabase.from('user_products').upsert({
                            user_id: userId,
                            product_id: product.id
                        }, { onConflict: 'user_id,product_id' });
                    } else {
                        console.error(`Product not found for key: ${productKey}`);
                    }
                } else {
                    // Standard Subscription Grant
                    console.log(`Updating profile for user ${userId} (${email}) to active`);
                    const { error: upsertError } = await supabase.from('profiles').upsert({
                        id: userId,
                        email: email,
                        full_name: fullName,
                        subscription_status: 'active',
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                    if (upsertError) {
                        console.error('Error upserting profile:', upsertError);
                        await supabase.from('profiles').update({
                            subscription_status: 'active',
                            updated_at: new Date().toISOString()
                        }).eq('email', email);
                    }
                }
            }

        } else if (['refunded', 'chargedback', 'subscription_canceled'].includes(orderStatus)) {
            // Cancel subscription
            await supabase.from('profiles').update({ subscription_status: 'canceled' }).eq('email', email);
        }

        // Final Logging (Non-blocking)
        try {
            await supabase.from('webhook_events').insert({
                event_type: eventType,
                user_email: email,
                payload: payload
            });
        } catch (e) { /* ignore */ }

        return res.status(200).json({ success: true, processed: true });

    } catch (err: any) {
        console.error('Catastrophic Webhook Failure:', err);
        return res.status(500).json({ error: 'Internal Server Error', detail: err.message });
    }
}
