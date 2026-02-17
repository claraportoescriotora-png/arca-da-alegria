
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
    model?: string;
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log("--- Starting Agent Flow (Dynamic Model) ---");

        // In Vercel Node.js, body is already a parsed object
        const body = req.body as AgentRequest;
        const { action, agentType, params, userId, model } = body;

        console.log(`Action: ${action}, Agent: ${agentType}, Theme: ${params?.theme}, Requested Model: ${model}`);

        // 1. Config & Auth
        const keysToFetch = [
            'google_gemini_api_key',
            'google_gemini_model',
            `agent_${agentType}_prompt`,
            'openrouter_api_key',
            'groq_api_key',
            'cerebras_api_key'
        ];

        const { data: configData } = await supabase
            .from('agent_config')
            .select('key, value')
            .in('key', keysToFetch);

        const config = (key: string) => configData?.find(c => c.key === key)?.value;

        const googleKey = config('google_gemini_api_key');
        const openrouterKey = config('openrouter_api_key');
        const groqKey = config('groq_api_key');
        const cerebrasKey = config('cerebras_api_key');

        const dbModel = config('google_gemini_model');
        const selectedModel = model || dbModel || 'gemini-flash-latest';
        const systemPrompt = config(`agent_${agentType}_prompt`) || 'Você é um assistente útil.';

        if (action === 'generate_story') {
            const theme = params?.theme || "Tema Bíblico Surpresa";

            // Fetch existing titles to avoid duplication
            const { data: existingStories } = await supabase
                .from('stories')
                .select('title')
                .order('created_at', { ascending: false })
                .limit(100);

            const existingTitles = existingStories?.map(s => s.title).join(', ') || 'Nenhum ainda';

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
            
            IMPORTANTE - FIDELIDADE BÍBLICA:
            1. Se a categoria for 'biblical', você deve seguir RIGOROSAMENTE o texto sagrado. 
            2. NÃO invente fatos, milagres ou eventos que não estão na Bíblia. "Inédita" significa uma nova forma de contar para crianças, não inventar novos fatos.
            3. JAMAIS misture personagens ou locais de épocas diferentes (ex: Noé não viveu em Sodoma, Davi não conheceu Moisés).
            4. Mantenha os personagens em seus contextos originais.

            IMPORTANTE - EVITE DUPLICIDADE:
            Já existem histórias com os seguintes títulos: [${existingTitles}].
            VOCÊ NÃO PODE REPETIR NENHUM DESSES TÍTULOS. Crie algo novo e criativo. 
            Você pode repetir personagens (ex: Daniel, Noé), mas o título e o enredo devem ser diferentes das histórias existentes.

            OBRIGATÓRIO: Retorne APENAS um JSON válido seguindo exatamente esta estrutura:
            ${JSON.stringify(jsonSchema)}
            
            Regras Adicionais:
            1. A história deve ser doce, educativa e cristã.
            2. O quiz deve ter 2 perguntas baseadas no texto gerado.
            3. A categoria deve ser 'biblical' (história da Bíblia) ou 'moral' (educativa/cotidiana).`;

            let outputText = "";
            let providerUsed = "";

            // Determine Provider
            if (selectedModel.includes('/') && openrouterKey) {
                // OpenRouter
                providerUsed = "OpenRouter";
                console.log(`Calling OpenRouter: ${selectedModel}...`);
                const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openrouterKey}`,
                        'HTTP-Referer': 'https://arcadaalegria.com.br',
                        'X-Title': 'Arca da Alegria Agent'
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        response_format: { type: 'json_object' }
                    })
                });
                const orData = await orRes.json() as any;
                if (!orRes.ok) throw new Error(`OpenRouter Error: ${orData?.error?.message || "Unknown"}`);
                outputText = orData.choices?.[0]?.message?.content;
            } else if (selectedModel.startsWith('llama-') && groqKey) {
                // Groq
                providerUsed = "Groq";
                console.log(`Calling Groq: ${selectedModel}...`);
                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${groqKey}`
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        response_format: { type: 'json_object' }
                    })
                });
                const groqData = await groqRes.json() as any;
                if (!groqRes.ok) throw new Error(`Groq Error: ${groqData?.error?.message || "Unknown"}`);
                outputText = groqData.choices?.[0]?.message?.content;
            } else if (selectedModel === 'llama3.1-70b' && cerebrasKey) {
                // Cerebras
                providerUsed = "Cerebras";
                console.log(`Calling Cerebras: ${selectedModel}...`);
                const cerRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${cerebrasKey}`
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ]
                    })
                });
                const cerData = await cerRes.json() as any;
                if (!cerRes.ok) throw new Error(`Cerebras Error: ${JSON.stringify(cerData?.error || "Unknown")}`);
                outputText = cerData.choices?.[0]?.message?.content;
            } else {
                // Default to Google GeminiDirect
                providerUsed = "Google Gemini";
                if (!googleKey) throw new Error("Google Gemini API Key missing");
                console.log(`Calling Google: ${selectedModel}...`);
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${googleKey}`;
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
                outputText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            }

            if (!outputText) throw new Error(`No content received from ${providerUsed}`);
            console.log(`Response received from ${providerUsed}.`);

            const jsonMatch = outputText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found in response");
            const data = JSON.parse(jsonMatch[0]);

            // 5. Image Generation (Non-blocking & Timed)
            console.log("Starting Image Flow...");
            let cover_url = 'https://images.unsplash.com/photo-1507457379470-08b800de837a'; // Default

            try {
                const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${googleKey}`;

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
            console.log("Checking for duplicate title...");
            const { data: existingTitleCheck } = await supabase
                .from('stories')
                .select('id')
                .eq('title', data.title)
                .single();

            if (existingTitleCheck) {
                throw new Error(`Título Duplicado: "${data.title}". A IA repetiu um título que já existe. Tente novamente.`);
            }

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

        } else if (action === 'list_models') {
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`;
            const listResponse = await fetch(listUrl);
            const listData = await listResponse.json() as any;
            return res.status(200).json({ success: true, models: listData.models || [] });
        }

    } catch (error: any) {
        console.error("Handler Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
