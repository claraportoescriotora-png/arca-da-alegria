import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN; // Add this to Vercel Env Vars

    // 1. Security Check (Optional but recommended)
    // Kiwify sends the token in the URL params usually (e.g. ?token=...)
    // OR we can check the signature if Kiwify sends it in headers.
    // For simplicity with Vercel/Kiwify, we check the query param 'token' if the env var is set.
    const url = new URL(request.url);
    const tokenFromUrl = url.searchParams.get('token');

    if (webhookToken && tokenFromUrl !== webhookToken) {
        return new Response('Unauthorized - Invalid Token', { status: 401 });
    }

    try {
        const payload = await request.json();
        console.log('Webhook payload:', JSON.stringify(payload, null, 2));

        // Kiwify Event Types/Status
        // events: order.approved, order.refunded, subscription.renewed, subscription.canceled, subscription.late
        const orderStatus = payload.order_status || payload.status;
        const eventType = payload.event_type || orderStatus; // Fallback

        // Extract email
        const customer = payload.customer || payload.Customer || {};
        const email = customer.email || payload.email;

        if (!email) {
            return new Response(JSON.stringify({ message: 'No email found in payload' }), { status: 400 });
        }

        // Determine new subscription status based on event
        let newStatus: 'active' | 'canceled' | 'pending' | null = null;

        if (orderStatus === 'paid' || eventType === 'order.approved' || eventType === 'subscription.renewed') {
            newStatus = 'active';
        } else if (orderStatus === 'refunded' || orderStatus === 'chargedback' || eventType === 'order.refunded' || eventType === 'subscription.canceled' || eventType === 'subscription.late') {
            newStatus = 'canceled';
        }

        if (newStatus) {
            if (!supabaseUrl || !supabaseServiceKey) {
                console.error('Missing Supabase Environment Variables');
                return new Response('Server Configuration Error', { status: 500 });
            }

            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // Update profile by email
            // REQUIRES: 'email' column in profiles table (see add_email_column.sql)
            const { data, error } = await supabase
                .from('profiles')
                .update({ subscription_status: newStatus })
                .eq('email', email)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                return new Response('Database Error', { status: 500 });
            }

            if (!data || data.length === 0) {
                console.warn('User not found:', email);
                return new Response('User not found in database', { status: 404 });
            }

            console.log(`User ${email} updated to ${newStatus}`);
            return new Response(JSON.stringify({ success: true, status: newStatus, user: data[0] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ message: 'Ignored event/status', event: eventType, status: orderStatus }), { status: 200 });

    } catch (err) {
        console.error('Webhook processing error:', err);
        return new Response('Internal Server Error', { status: 500 });
    }
}
