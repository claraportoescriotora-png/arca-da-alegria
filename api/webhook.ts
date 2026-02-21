
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './lib/resend';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
    // Determine if it's a Node request or a Web Request (Vercel can be tricky)
    const isNode = !!req.headers && !req.json;

    // Normalize properties
    const method = isNode ? req.method : (req as Request).method;

    if (method !== 'POST') {
        if (isNode) return res.status(405).send('Method not allowed');
        return new Response('Method not allowed', { status: 405 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const signatureSecret = process.env.KIWIFY_SIGNATURE_SECRET;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing critical env vars');
        if (isNode) return res.status(500).json({ error: 'Server Configuration Error', detail: 'Missing Supabase Keys' });
        return new Response('Server Configuration Error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        let payload: any;
        let rawBody: string = "";

        if (isNode) {
            // Vercel Node functions usually parse the body already
            payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        } else {
            const webReq = req as Request;
            rawBody = await webReq.text();
            payload = JSON.parse(rawBody);
        }

        // HMAC Validation or Internal Bypass
        const bypassKey = isNode ? req.headers['x-test-bypass'] : (req as Request).headers.get('x-test-bypass');
        const isInternalTest = internalSecret && bypassKey === internalSecret;

        if (signatureSecret && !isInternalTest) {
            const signature = isNode ? req.headers['x-kiwify-signature'] : (req as Request).headers.get('x-kiwify-signature');
            if (signature) {
                const crypto = await import('crypto');
                const hmac = crypto.createHmac('sha256', signatureSecret);
                hmac.update(rawBody);
                const expectedSignature = hmac.digest('hex');

                if (signature !== expectedSignature) {
                    if (isNode) return res.status(401).send('Unauthorized - Invalid Signature');
                    return new Response('Unauthorized - Invalid Signature', { status: 401 });
                }
            }
        }

        const orderStatus = payload.order_status || payload.status;
        const eventType = payload.webhook_event_type || payload.event_type || orderStatus;
        const customer = payload.Customer || payload.customer || {};
        const email = customer.email || payload.email;

        if (!email) {
            if (isNode) return res.status(400).send('No email found');
            return new Response('No email found', { status: 400 });
        }

        console.log(`Processing Kiwify event: ${eventType} for ${email} (InternalTest: ${isInternalTest})`);

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
                    // Generate Magic Link
                    // Use a safe origin (Host header or env)
                    const host = isNode ? req.headers['host'] : new URL((req as Request).url).host;
                    const protocol = isNode ? (req.headers['x-forwarded-proto'] || 'https') : 'https';
                    const origin = `${protocol}://${host}`;

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
        try {
            await supabase.from('webhook_events').insert({
                event_type: eventType,
                user_email: email,
                payload: payload,
                created_at: new Date().toISOString()
            });
        } catch (logErr) {
            console.error('Failed to log webhook event:', logErr);
        }

        if (isNode) return res.status(200).json({ success: true });
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Webhook Error:', err.message);
        if (isNode) return res.status(500).json({ error: 'Internal Server Error', message: err.message });
        return new Response('Internal Server Error', { status: 500 });
    }
}
