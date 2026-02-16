
import { createClient } from '@supabase/supabase-js';
// @ts-ignore - Local IDE cache issue, works in production
import sharp from 'sharp';

export const config = {
    runtime: 'nodejs',
    maxDuration: 60,
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface AgentRequest {
    action: 'generate_story';
    agentType: 'storyteller';
    params?: {
        theme?: string;
    };
    userId?: string;
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log("--- Starting Agent Flow (Fixed Node.js Signature) ---");

        // In Vercel Node.js, body is already a parsed object
        const body = req.body as AgentRequest;
        const { action, agentType, params, userId } = body;

        console.log(`Action: ${action}, Agent: ${agentType}, Theme: ${params?.theme}`);

        // 1. Config & Auth
        const { data: configData } = await supabase
            .from('agent_config')
            .select('key, value')
            .in('key', ['google_gemini_api_key', `agent_${agentType}_prompt`]);

        const apiKey = configData?.find(c => c.key === 'google_gemini_api_key')?.value;
        const systemPrompt = configData?.find(c => c.key === `agent_${agentType}_prompt`)?.value
            || 'Você é um assistente útil.';

        if (!apiKey) return res.status(400).json({ error: 'API Key missing' });

        // 2. Prompt Engineering
        const theme = params?.theme || "Tema Bíblico Surpresa";

        const jsonSchema = {
            title: "Título da História",
            moral: "Moral da história em uma frase",
            category: "biblical | moral",
            content: "Texto completo da história (min 3 parágrafos)...",
            quiz: [
                {
                    question: "Pergunta 1?",
                    options: [
                        { text: "Opção A", is_correct: false },
                        { text: "Opção B (Certa)", is_correct: true },
                        { text: "Opção C", is_correct: false }
                    ]
                }
            ]
        };

        const userPrompt = `Crie uma história infantil INÉDITA sobre: ${theme}.
        OBRIGATÓRIO: Retorne APENAS um JSON válido seguindo exatamente esta estrutura:
        ${JSON.stringify(jsonSchema)}
        
        Regras:
        1. A história deve ser doce, educativa e cristã.
        2. O quiz deve ter 2 perguntas.
        3. A categoria deve ser obrigatoriamente 'biblical' (para histórias da Bíblia) ou 'moral' (para histórias educativas).`;

        // 3. Gemini Call (Text)
        console.log("Calling Gemini...");
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `System: ${systemPrompt}\nUser: ${userPrompt}` }]
                }]
            })
        });

        const geminiData = await geminiResponse.json() as any;
        if (!geminiResponse.ok) throw new Error(`Gemini Error: ${geminiData?.error?.message || "Unknown"}`);

        const outputText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!outputText) throw new Error('No content from Gemini');

        const jsonMatch = outputText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        const data = JSON.parse(jsonMatch[0]);

        // 5. Image Generation (Non-blocking & Timed)
        console.log("Starting Image Flow...");
        let cover_url = 'https://images.unsplash.com/photo-1507457379470-08b800de837a'; // Default

        try {
            const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

            // Set a strict timeout for image generation to avoid 504
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s max for image

            const imagenResponse = await fetch(imagenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    instances: [{ prompt: `Children book illustration, watercolor style, soft colors, high quality, Christian theme: ${data.title}` }],
                    parameters: { sampleCount: 1 }
                })
            });
            clearTimeout(timeoutId);

            const imagenData = await imagenResponse.json() as any;
            if (imagenResponse.ok && imagenData.predictions?.[0]?.bytesBase64Encoded) {
                console.log("Image received, optimizing...");
                const buffer = Buffer.from(imagenData.predictions[0].bytesBase64Encoded, 'base64');

                let optimizedBuffer = await sharp(buffer)
                    .resize(800, 800, { fit: 'inside' })
                    .webp({ quality: 70 })
                    .toBuffer();

                if (optimizedBuffer.length > 80 * 1024) {
                    optimizedBuffer = await sharp(buffer)
                        .resize(600, 600, { fit: 'inside' })
                        .webp({ quality: 60 })
                        .toBuffer();
                }

                const fileName = `story_${Date.now()}.webp`;
                const { error: uploadError } = await supabase.storage
                    .from('stories')
                    .upload(fileName, optimizedBuffer, {
                        contentType: 'image/webp',
                        cacheControl: '3600'
                    });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(fileName);
                    cover_url = publicUrl;
                }
            }
        } catch (imgError: any) {
            console.warn("Image skip:", imgError.message);
            // Fallback to default
        }

        // 6. DB Insertion
        console.log("Saving to Supabase...");

        // Map category to DB constraint
        let finalCategory = 'biblical';
        const receivedCat = String(data.category).toLowerCase();
        if (receivedCat.includes('moral')) finalCategory = 'moral';
        if (receivedCat.includes('biblical')) finalCategory = 'biblical';

        const { data: story, error: storyError } = await supabase.from('stories').insert({
            title: data.title,
            content: data.content,
            moral: data.moral,
            category: finalCategory,
            cover_url: cover_url,
            duration: '5 min',
            is_premium: true, // Standard for Arca
            audio_url: ''
        }).select().single();

        if (storyError) throw storyError;

        // 7. Quiz Insertion
        if (data.quiz && Array.isArray(data.quiz)) {
            for (const q of data.quiz) {
                const { data: question } = await supabase.from('quiz_questions').insert({
                    content_id: story.id,
                    question: q.question,
                    order_index: 1
                }).select().single();

                if (question && q.options) {
                    const optionsPayload = q.options.map((opt: any) => ({
                        question_id: question.id,
                        text: opt.text,
                        is_correct: opt.is_correct
                    }));
                    await supabase.from('quiz_alternatives').insert(optionsPayload);
                }
            }
        }

        console.log("Flow completed successfully!");
        return res.status(200).json({ success: true, data: data.title });

    } catch (error: any) {
        console.error("Handler Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
