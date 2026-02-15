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
    const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN;

    // 1. Security Check
    const url = new URL(request.url);
    const tokenFromUrl = url.searchParams.get('token');

    if (webhookToken && tokenFromUrl !== webhookToken) {
        return new Response('Unauthorized - Invalid Token', { status: 401 });
    }

    try {
        const payload = await request.json();
        console.log('Webhook payload:', JSON.stringify(payload, null, 2));

        // 2. Parse Event & Customer Data
        const orderStatus = payload.order_status || payload.status;
        const eventType = payload.webhook_event_type || payload.event_type || orderStatus || 'unknown';

        const customer = payload.Customer || payload.customer || {};
        const email = customer.email || payload.email;
        const subscription = payload.Subscription || {};

        // 3. Log Event to 'webhook_events' (Abru Intelligence)
        if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // Log raw event asynchronously
            await supabase.from('webhook_events').insert({
                event_type: eventType,
                user_email: email,
                payload: payload
            }).then(({ error }) => {
                if (error) console.error('Error logging webhook event:', error);
            });

            if (!email) {
                return new Response(JSON.stringify({ message: 'No email found' }), { status: 400 });
            }

            // 4. Determine Subscription Status
            let newStatus: 'active' | 'canceled' | 'pending' | null = null;

            // Approved/Renewed/Paid
            if (
                orderStatus === 'paid' ||
                eventType === 'order_approved' ||
                eventType === 'subscription_renewed'
            ) {
                newStatus = 'active';
            }
            // Canceled/Refunded/Chargeback/Late
            else if (
                orderStatus === 'refunded' ||
                orderStatus === 'chargedback' ||
                eventType === 'order_refunded' ||
                eventType === 'subscription_canceled' ||
                eventType === 'subscription_late'
            ) {
                newStatus = 'canceled';
            }

            // 5. Update Profile (Upsert Data)
            if (newStatus) {
                const updateData = {
                    subscription_status: newStatus,
                    cpf: customer.CPF || customer.cpf,
                    phone: customer.mobile || customer.phone,
                    plan_type: subscription.plan?.name || payload.Product?.product_name || 'unknown',
                    kiwify_customer_id: customer.id
                };

                const { data, error } = await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('email', email)
                    .select();

                if (error) {
                    console.error('Supabase profile update error:', error);
                    return new Response('Database Error', { status: 500 });
                }

                if (!data || data.length === 0) {
                    console.warn(`User ${email} not found for update.`);
                    return new Response('User not found in profiles', { status: 404 });
                }

                console.log(`Updated user ${email}: Status=${newStatus}, Plan=${updateData.plan_type}`);
                return new Response(JSON.stringify({
                    success: true,
                    status: newStatus,
                    data: updateData
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            return new Response(JSON.stringify({ message: 'Event logged but no status change needed', event: eventType }), { status: 200 });
        } else {
            return new Response('Server Configuration Error', { status: 500 });
        }

    } catch (err) {
        console.error('Webhook processing error:', err);
        return new Response('Internal Server Error', { status: 500 });
    }
}
