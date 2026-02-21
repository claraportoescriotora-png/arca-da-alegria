
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './lib/resend.js'; // Added .js extension for ESM safety

export default async function handler(req: any, res: any) {
    console.log('--- Kiwify Webhook: Request Received ---');

    // Basic catch-all to prevent 500 FUNCTION_INVOCATION_FAILED
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Configuration (Moved inside handler for safety)
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const internalSecret = process.env.INTERNAL_API_SECRET;
        const signatureSecret = process.env.KIWIFY_SIGNATURE_SECRET;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('CRITICAL: Server is missing Supabase environment variables');
            return res.status(500).json({
                error: 'Server Config Error',
                message: 'Chaves do Supabase não encontradas no ambiente do servidor.'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Body parsing
        const payload = req.body;
        if (!payload) {
            return res.status(400).json({ error: 'Empty body' });
        }

        // HMAC Validation or Internal Bypass
        const bypassKey = req.headers['x-test-bypass'];
        const isInternalTest = internalSecret && bypassKey === internalSecret;

        if (signatureSecret && !isInternalTest) {
            const signature = req.headers['x-kiwify-signature'];
            if (signature) {
                const crypto = await import('crypto');
                const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
                const hmac = crypto.createHmac('sha256', signatureSecret);
                hmac.update(rawBody);
                const expectedSignature = hmac.digest('hex');

                if (signature !== expectedSignature) {
                    return res.status(401).send('Unauthorized - Invalid Signature');
                }
            }
        }

        const orderStatus = payload.order_status || payload.status;
        const eventType = payload.webhook_event_type || payload.event_type || orderStatus;
        const customer = (payload.Customer || payload.customer || {});
        const email = customer.email || payload.email;

        if (!email) {
            console.error('Payload missing email:', JSON.stringify(payload).substring(0, 200));
            return res.status(400).json({ error: 'No email found in data' });
        }

        console.log(`Event: ${eventType}, Status: ${orderStatus}, Target: ${email}`);

        // 1. Process Order
        if (orderStatus === 'paid' || eventType === 'order_approved' || eventType === 'subscription_renewed') {

            // Check existing user
            const { data: authData } = await supabase.auth.admin.listUsers();
            const existingUser = authData?.users.find(u => u.email === email);

            if (!existingUser) {
                console.log(`Creating user: ${email}`);
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email,
                    email_confirm: true,
                    user_metadata: { source: 'kiwify', test: isInternalTest }
                });

                if (!createError && newUser) {
                    // Magic Link
                    const host = req.headers['host'] || 'meuamiguito.com.br';
                    const protocol = req.headers['x-forwarded-proto'] || 'https';
                    const origin = `${protocol}://${host}`;

                    const { data: linkData } = await supabase.auth.admin.generateLink({
                        type: 'magiclink',
                        email: email,
                        options: { redirectTo: `${origin}/welcome` }
                    });

                    if (linkData?.properties?.action_link) {
                        await sendWelcomeEmail(email, linkData.properties.action_link);
                    }
                }
            }

            // Always update/upsert profile status
            await supabase.from('profiles').upsert({
                email: email,
                subscription_status: 'active',
                updated_at: new Date().toISOString()
            }, { onConflict: 'email' });

        } else if (['refunded', 'chargedback', 'subscription_canceled', 'subscription_late'].includes(orderStatus)) {
            await supabase.from('profiles').update({ subscription_status: 'canceled' }).eq('email', email);
        }

        // 2. Persistent Logging (Optional, don't crash if fails)
        try {
            await supabase.from('webhook_events').insert({
                event_type: eventType,
                user_email: email,
                payload: payload
            });
        } catch (e) {
            console.warn('Logging skipped:', (e as Error).message);
        }

        return res.status(200).json({
            success: true,
            simulation: !!isInternalTest
        });

    } catch (err: any) {
        console.error('Global Webhook Error:', err);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}
