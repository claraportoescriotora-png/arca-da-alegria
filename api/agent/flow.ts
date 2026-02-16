
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

export const config = {
    runtime: 'nodejs',
    maxDuration: 60, // Increase timeout to 60s (Pro/Advanced plans)
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

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        console.log("--- Starting Agent Flow ---");
        const { action, agentType, params, userId } = await req.json() as AgentRequest;
        console.log(`Action: ${action}, Agent: ${agentType}, Theme: ${params?.theme}`);

        // 1. Config & Auth
        const { data: configData } = await supabase
            .from('agent_config')
            .select('key, value')
            .in('key', ['google_gemini_api_key', `agent_${agentType}_prompt`]);

        const apiKey = configData?.find(c => c.key === 'google_gemini_api_key')?.value;
        const systemPrompt = configData?.find(c => c.key === `agent_${agentType}_prompt`)?.value
            || 'Você é um assistente útil.';

        if (!apiKey) return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 400 });

        // 2. Prompt Engineering
        const theme = params?.theme || "Tema Bíblico Surpresa";

        const jsonSchema = {
            title: "Título da História",
            moral: "Moral da história em uma frase",
            category: "Antigo Testamento | Novo Testamento | Moral",
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
        3. A categoria deve ser uma das 3 listadas.`;

        // 3. Gemini Call (Text)
        console.log("Calling Gemini for text generation...");
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

        // 4. Parse & Validate
        const jsonMatch = outputText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        const data = JSON.parse(jsonMatch[0]);

        // 5. Image Generation (Imagen 3 via Vertex AI / API Studio)
        console.log("Calling Imagen 3 for cover art...");
        const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

        let cover_url = 'https://images.unsplash.com/photo-1507457379470-08b800de837a'; // Default

        try {
            const imagenResponse = await fetch(imagenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: `Children book illustration, watercolor style, soft colors, high quality, Christian theme: ${data.title}` }],
                    parameters: { sampleCount: 1 }
                })
            });

            const imagenData = await imagenResponse.json() as any;
            console.log("Imagen response status:", imagenResponse.status);

            if (imagenResponse.ok && imagenData.predictions?.[0]?.bytesBase64Encoded) {
                console.log("Image generated successfully, optimizing with Sharp...");
                const buffer = Buffer.from(imagenData.predictions[0].bytesBase64Encoded, 'base64');

                // 6. Image Optimization (Sharp)
                let optimizedBuffer = await sharp(buffer)
                    .resize(800, 800, { fit: 'inside' })
                    .webp({ quality: 70 })
                    .toBuffer();

                // Dynamic size reduction if > 80kb
                if (optimizedBuffer.length > 80 * 1024) {
                    console.log("Image > 80kb, retrying with lower resolution...");
                    optimizedBuffer = await sharp(buffer)
                        .resize(600, 600, { fit: 'inside' })
                        .webp({ quality: 60 })
                        .toBuffer();
                }

                // 7. Upload to Supabase Storage
                console.log("Uploading to Supabase Storage...");
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
                    console.log("Upload successful:", cover_url);
                } else {
                    console.error("Upload error:", uploadError);
                }
            } else {
                console.warn("Imagen failed or returned no data:", imagenData?.error?.message || "No predictions");
            }
        } catch (imgError: any) {
            console.error("Critical error in image generation flow:", imgError.message);
            // Non-blocking, continue with default cover
        }

        // 8. Duplicate Check
        console.log("Checking for duplicates and inserting into DB...");
        const { data: existing } = await supabase
            .from('stories')
            .select('id')
            .eq('title', data.title)
            .maybeSingle();

        if (existing) throw new Error(`Duplicate story: "${data.title}"`);

        // 9. DB Transaction
        const { data: story, error: storyError } = await supabase.from('stories').insert({
            title: data.title,
            content: data.content,
            moral: data.moral,
            category: data.category || 'Histórias',
            is_published: false,
            cover_url: cover_url
        }).select().single();

        if (storyError) throw storyError;

        // Insert Quiz
        if (data.quiz && Array.isArray(data.quiz)) {
            for (const q of data.quiz) {
                const { data: question, error: qError } = await supabase.from('quiz_questions').insert({
                    content_id: story.id,
                    question: q.question,
                    order_index: 1
                }).select().single();

                if (!qError && q.options) {
                    const optionsPayload = q.options.map((opt: any) => ({
                        question_id: question.id,
                        text: opt.text,
                        is_correct: opt.is_correct
                    }));
                    await supabase.from('quiz_alternatives').insert(optionsPayload);
                }
            }
        }

        return new Response(JSON.stringify({ success: true, data: data.title }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
