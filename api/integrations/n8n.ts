
export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const internalSecret = process.env.INTERNAL_API_SECRET;
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    // 1. Security Check (Internal Secret)
    const authHeader = request.headers.get('x-internal-secret');

    if (!internalSecret || authHeader !== internalSecret) {
        return new Response('Unauthorized - Invalid Internal Secret', { status: 401 });
    }

    if (!n8nWebhookUrl) {
        console.error('N8N_WEBHOOK_URL not configured');
        return new Response('Server Configuration Error', { status: 500 });
    }

    try {
        const payload = await request.json();

        // 2. Forward to n8n
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error forwarding to n8n:', response.status, errorText);
            // Don't fail the internal request if n8n fails, just log it? 
            // Or return error? User asked to return { success: true } if valid.
            // Let's log but return success to not block the caller, 
            // unless acceptable to fail.
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Integration error:', err);
        return new Response('Internal Server Error', { status: 500 });
    }
}
