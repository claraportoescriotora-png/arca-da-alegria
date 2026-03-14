
import { createClient } from '@supabase/supabase-js';
import { sendMagicLinkEmail } from '../lib/resend.js';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const email = req.body?.email;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server Configuration Error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Generate a magic link via admin API
        let origin = req.headers.origin || 'https://www.meuamiguito.com.br';
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            origin = 'https://www.meuamiguito.com.br';
        }

        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${origin}/home`
            }
        });

        if (linkError) {
            console.error('Error generating link:', linkError);
            return res.status(400).json({ error: linkError.message });
        }

        if (linkData?.properties?.action_link) {
            // Send the premium email via Resend
            await sendMagicLinkEmail(email, linkData.properties.action_link);

            return res.status(200).json({ success: true });
        }

        return res.status(500).json({ error: 'Internal error sending link' });
    } catch (error: any) {
        console.error('Login Link API Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
