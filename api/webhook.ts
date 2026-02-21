
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './lib/resend';

export const config = {
    runtime: 'nodejs',
};

// Use standard Node.js (req, res) signature
export default async function handler(req: any, res: any) {
    console.log('--- Webhook Handler Started ---');

    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gypzrzsmxgjtkidznstd.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const signatureSecret = process.env.KIWIFY_SIGNATURE_SECRET;

    if (!supabaseServiceKey) {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables');
        return res.status(500).json({
            error: 'Server Configuration Error',
            detail: 'A chave secreta do Supabase (Service Role) não foi configurada no servidor.'
        });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Vercel handles body parsing for Node.js functions
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

        // HMAC Validation or Internal Bypass
        // Node.js headers are accessed via req.headers[key] (lowercase)
        const bypassKey = req.headers['x-test-bypass'];
        const isInternalTest = bypassKey && bypassKey === internalSecret;

        console.log(`Bypass Check - Header: ${bypassKey}, Matches: ${isInternalTest}`);

        if (signatureSecret && !isInternalTest) {
            const signature = req.headers['x-kiwify-signature'];
            if (signature) {
                const crypto = await import('crypto');
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
        const customer = payload.Customer || payload.customer || {};
        const email = customer.email || payload.email;

        if (!email) {
            return res.status(400).send('No email found in payload');
        }

        console.log(`Processing Kiwify event: ${eventType} for ${email}`);

        // 1. Handle Account Activation
        if (orderStatus === 'paid' || eventType === 'order_approved' || eventType === 'subscription_renewed') {

            // A. Check if user exists in Auth
            try {
                const { data: authData, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) throw listError;

                const existingUser = authData?.users.find(u => u.email === email);

                if (!existingUser) {
                    console.log(`Creating new auth user for ${email}`);
                    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                        email,
                        email_confirm: true,
                        user_metadata: { source: 'kiwify', payment_id: payload.order_id }
                    });

                    if (createError) {
                        console.error('Supabase Auth error:', createError);
                    } else {
                        // Generate Magic Link
                        const host = req.headers['host'] || 'www.meuamiguito.com.br';
                        const protocol = req.headers['x-forwarded-proto'] || 'https';
                        const origin = `${protocol}://${host}`;

                        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                            type: 'magiclink',
                            email: email,
                            options: { redirectTo: `${origin}/welcome` }
                        });

                        if (!linkError && linkData?.properties?.action_link) {
                            try {
                                await sendWelcomeEmail(email, linkData.properties.action_link);
                                console.log('Welcome email sent via Resend');
                            } catch (emailErr) {
                                console.error('Resend delivery failed:', emailErr);
                            }
                        }
                    }
                }
            } catch (authErr) {
                console.error('Auth check/create failed:', authErr);
                // Continue to profile upsert anyway
            }

            // B. Ensure profile is active and synced
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    email: email,
                    subscription_status: 'active',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'email' });

            if (profileError) console.error('Profile sync error:', profileError);

        } else if (['refunded', 'chargedback', 'subscription_canceled', 'subscription_late'].includes(orderStatus) ||
            ['order_refunded', 'subscription_canceled', 'subscription_late'].includes(eventType)) {

            await supabase
                .from('profiles')
                .update({ subscription_status: 'canceled' })
                .eq('email', email);
        }

        // Log the event for audit trail (Defensive)
        try {
            await supabase.from('webhook_events').insert({
                event_type: eventType,
                user_email: email,
                payload: payload,
                created_at: new Date().toISOString()
            });
        } catch (logErr) {
            console.error('Webhook logging skipped (table might be missing):', logErr);
        }

        return res.status(200).json({
            success: true,
            mode: isInternalTest ? 'test' : 'production',
            message: isInternalTest ? 'Simulação concluída' : 'Evento processado'
        });

    } catch (err: any) {
        console.error('Runtime Webhook Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
}
