
import { createClient } from '@supabase/supabase-js';
import { sendMagicLinkEmail } from '../lib/resend';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const { email } = await request.json();

    if (!email) {
        return new Response('Email is required', { status: 400 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return new Response('Server Configuration Error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Generate a magic link via admin API
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${new URL(request.url).origin}/home`
            }
        });

        if (linkError) {
            console.error('Error generating link:', linkError);
            return new Response(JSON.stringify({ error: linkError.message }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (linkData?.properties?.action_link) {
            // Send the premium email via Resend
            await sendMagicLinkEmail(email, linkData.properties.action_link);

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response('Internal error sending link', { status: 500 });
    } catch (error: any) {
        console.error('Login Link API Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
