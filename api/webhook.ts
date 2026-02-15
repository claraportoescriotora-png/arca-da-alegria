import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const payload = await request.json();
        console.log('Webhook payload:', payload);

        // Kiwify payload structure varies, check documentation or logs
        // Common: { order_status: "paid", customer: { email: "..." } }
        const orderStatus = payload.order_status || payload.status;
        const customer = payload.customer || payload.Customer || {};
        const email = customer.email || payload.email;

        if (orderStatus === 'paid' && email) {
            // Initialize Supabase with Service Role Key for admin privileges
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (!supabaseUrl || !supabaseServiceKey) {
                console.error('Missing Supabase Environment Variables');
                return new Response('Server Configuration Error', { status: 500 });
            }

            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // Update profile by email
            // REQUIRES: 'email' column in profiles table (see add_email_column.sql)
            const { data, error } = await supabase
                .from('profiles')
                .update({ subscription_status: 'active' })
                .eq('email', email)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                return new Response('Database Error', { status: 500 });
            }

            if (!data || data.length === 0) {
                console.warn('User not found:', email);
                return new Response('User not found', { status: 404 });
            }

            return new Response(JSON.stringify({ success: true, user: data[0] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ message: 'Ignored', reason: 'Not paid or no email' }), { status: 200 });

    } catch (err) {
        console.error('Webhook processing error:', err);
        return new Response('Internal Server Error', { status: 500 });
    }
}
