import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import webpush from 'web-push';

export const config = {
    runtime: 'nodejs',
};

// Configure Web Push if keys are present
if (process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:suporte@meuamiguito.com.br',
        process.env.VITE_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { campaign_id } = req.body;
    if (!campaign_id) return res.status(400).json({ error: 'campaign_id is required' });

    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server Configuration Error' });
    }

    // Bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    // User context to verify token
    const userClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });

    try {
        const { data: { user }, error: userError } = await userClient.auth.getUser();
        if (userError || !user) return res.status(401).json({ error: 'Unauthorized' });

        const { data: admin } = await supabaseAdmin.from('admins').select('id').eq('id', user.id).single();
        if (!admin) return res.status(403).json({ error: 'Forbidden' });

        // Get Campaign
        const { data: campaign, error: campError } = await supabaseAdmin
            .from('crm_campaigns')
            .select('*')
            .eq('id', campaign_id)
            .single();
        
        if (campError || !campaign) throw new Error('Campaign not found');
        if (campaign.status === 'sent') return res.status(400).json({ error: 'Campaign already sent' });

        // Mark as sending
        await supabaseAdmin.from('crm_campaigns').update({ status: 'sending' }).eq('id', campaign.id);

        // Fetch target leads
        let leadsQuery = supabaseAdmin.from('crm_leads').select('*');
        if (campaign.target_tags && campaign.target_tags.length > 0) {
            leadsQuery = leadsQuery.overlaps('tags', campaign.target_tags);
        }

        const { data: leads, error: leadsError } = await leadsQuery;
        if (leadsError) throw leadsError;

        let emailsSent = 0;
        let pushesSent = 0;

        const isEmail = campaign.type === 'email' || campaign.type === 'both';
        const isPush = campaign.type === 'push' || campaign.type === 'both';

        let resend: Resend | null = null;
        if (isEmail && process.env.RESEND_API_KEY) {
            resend = new Resend(process.env.RESEND_API_KEY);
        }

        // Load Push Subs if needed
        let pushSubs: any[] = [];
        const userIds = (leads || []).map((l: any) => l.user_id).filter(Boolean);
        if (isPush && userIds.length > 0) {
            const { data: subs } = await supabaseAdmin
                .from('push_subscriptions')
                .select('user_id, subscription')
                .in('user_id', userIds);
            pushSubs = subs || [];
        }

        // Loop over leads and dispatch
        for (const lead of leads || []) {
            // E-mail Broadcast
            if (isEmail && resend && lead.email) {
                try {
                    await resend.emails.send({
                        from: 'Arca da Alegria <nao-responda@meuamiguito.com.br>',
                        to: lead.email,
                        subject: campaign.subject || 'Novidade na Arca!',
                        html: campaign.content
                    });
                    emailsSent++;
                } catch (e) {
                    console.error(`Email send error for ${lead.email}:`, e);
                }
            }

            // Web Push Broadcast
            if (isPush && lead.user_id && process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
                const subs = pushSubs.filter(s => s.user_id === lead.user_id);
                for (const sub of subs) {
                    try {
                        await webpush.sendNotification(
                            sub.subscription,
                            JSON.stringify({
                                title: campaign.subject || 'Noé tem um recado!',
                                body: campaign.content.replace(/<[^>]*>?/gm, ''), // strip simple HTML for push plain text
                                icon: 'https://www.meuamiguito.com.br/icon-192x192.png',
                                badge: 'https://www.meuamiguito.com.br/icon-192x192.png',
                                url: '/home'
                            })
                        );
                        pushesSent++;
                    } catch (e: any) {
                        console.error('Push send error:', e);
                        if (e.statusCode === 410) {
                            // Subscription expired or unsubscribed
                            await supabaseAdmin
                                .from('push_subscriptions')
                                .delete()
                                .eq('subscription->>endpoint', sub.subscription.endpoint);
                        }
                    }
                }
            }
        }

        // Finalize Campaign
        await supabaseAdmin.from('crm_campaigns').update({
            status: 'sent',
            stats: { emails: emailsSent, pushes: pushesSent, total_leads: leads?.length || 0 }
        }).eq('id', campaign.id);

        return res.status(200).json({ success: true, emailsSent, pushesSent, leadsTargeted: leads?.length || 0 });
    } catch (error: any) {
        console.error('Campaign Dispatch Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
