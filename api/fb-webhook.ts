import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gypzrzsmxgjtkidznstd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VERIFY_TOKEN = 'arca123';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Webhook Verification (GET request)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('WEBHOOK_VERIFIED');
                return res.status(200).send(challenge);
            } else {
                return res.status(403).json({ error: 'Verification failed' });
            }
        }
        return res.status(400).json({ error: 'Missing hub parameters' });
    }

    // 2. Receiving Messages (POST request)
    if (req.method === 'POST') {
        const body = req.body;

        try {
            if (body.object === 'instagram' || body.object === 'page') {
                for (const entry of body.entry) {
                    const webhookEvent = entry.messaging?.[0];
                    if (!webhookEvent) continue;

                    const senderId = webhookEvent.sender?.id;
                    const messageText = webhookEvent.message?.text;

                    // Only process text messages from users (ignore echoes/reactions for now)
                    if (senderId && messageText && !webhookEvent.message.is_echo) {
                        
                        // Check if lead exists by social_id
                        let { data: lead } = await supabase
                            .from('crm_leads')
                            .select('id')
                            .eq('social_id', senderId)
                            .maybeSingle();

                        // If not, create a new lead in "Novo lead"
                        if (!lead) {
                            const { data: newLead, error: insertError } = await supabase
                                .from('crm_leads')
                                .insert({
                                    social_id: senderId,
                                    stage: 'Novo lead',
                                    name: 'Lead do Instagram' // placeholder
                                })
                                .select('id')
                                .single();

                            if (insertError) {
                                console.error('Error creating CRM lead from webhook:', insertError);
                                continue;
                            }
                            lead = newLead;
                        }

                        // Store the message
                        await supabase
                            .from('crm_messages')
                            .insert({
                                lead_id: lead.id,
                                content: messageText,
                                is_from_user: true
                            });

                    }
                }
                return res.status(200).send('EVENT_RECEIVED');
            } else {
                return res.status(404).send('Not Found');
            }
        } catch (e: any) {
            console.error('Webhook processing error:', e);
            return res.status(500).send('Internal Server Error');
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
