import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './lib/resend';

export const config = {
    runtime: 'nodejs', // Changed to nodejs to use Resend & Auth Admin features properly
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN;
    const signatureSecret = process.env.KIWIFY_SIGNATURE_SECRET;

    if (!supabaseUrl || !supabaseServiceKey) {
        return new Response('Server Configuration Error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const rawBody = await request.text();
        const payload = JSON.parse(rawBody);

        // HMAC Validation or Internal Bypass
        const bypassKey = request.headers.get('x-test-bypass');
        const isInternalTest = bypassKey && bypassKey === process.env.INTERNAL_API_SECRET;

        if (signatureSecret && !isInternalTest) {
            const signature = request.headers.get('x-kiwify-signature');
            if (signature) {
                const crypto = await import('crypto');
                const hmac = crypto.createHmac('sha256', signatureSecret);
                hmac.update(rawBody);
                const expectedSignature = hmac.digest('hex');

                if (signature !== expectedSignature) {
                    return new Response('Unauthorized - Invalid Signature', { status: 401 });
                }
            }
        }

        const orderStatus = payload.order_status || payload.status;
        const eventType = payload.webhook_event_type || payload.event_type || orderStatus;
        const customer = payload.Customer || payload.customer || {};
        const email = customer.email || payload.email;

        if (!email) {
            return new Response('No email found', { status: 400 });
        }

        console.log(`Processing Kiwify event: ${eventType} for ${email}`);

        // 1. Handle Account Activation
        if (orderStatus === 'paid' || eventType === 'order_approved' || eventType === 'subscription_renewed') {

            // A. Check if user exists in Auth
            const { data: authData } = await supabase.auth.admin.listUsers();
            const existingUser = authData?.users.find(u => u.email === email);

            if (!existingUser) {
                console.log(`Creating new user for ${email}`);
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email,
                    email_confirm: true,
                    user_metadata: { source: 'kiwify', payment_id: payload.order_id }
                });

                if (createError) {
                    console.error('Error creating user:', createError);
                } else {
                    // Generate Magic Link for first access
                    const origin = new URL(request.url).origin;
                    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                        type: 'magiclink',
                        email: email,
                        options: { redirectTo: `${origin}/welcome` }
                    });

                    if (!linkError && linkData?.properties?.action_link) {
                        try {
                            await sendWelcomeEmail(email, linkData.properties.action_link);
                        } catch (emailErr) {
                            console.error('Failed to send Resend email:', emailErr);
                        }
                    }
                }
            }

            // B. Ensure profile is active and synced
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    email: email,
                    subscription_status: 'active',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'email' });

            if (profileError) console.error('Error syncing profile status:', profileError);

        } else if (['refunded', 'chargedback', 'subscription_canceled', 'subscription_late'].includes(orderStatus) ||
            ['order_refunded', 'subscription_canceled', 'subscription_late'].includes(eventType)) {

            await supabase
                .from('profiles')
                .update({ subscription_status: 'canceled' })
                .eq('email', email);
        }

        // Log the event for audit trail
        await supabase.from('webhook_events').insert({
            event_type: eventType,
            user_email: email,
            payload: payload,
            created_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Webhook Error:', err.message);
        return new Response('Internal Server Error', { status: 500 });
    }
}
