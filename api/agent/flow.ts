
import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface AgentRequest {
    action: 'generate_story'; // Expanded in future for missions
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
        const { action, agentType, params, userId } = await req.json() as AgentRequest;

        // 1. Config & Auth
        const { data: configData } = await supabase
            .from('agent_config')
            .select('key, value')
            .in('key', ['google_gemini_api_key', `agent_${agentType}_prompt`]);

        const apiKey = configData?.find(c => c.key === 'google_gemini_api_key')?.value;
        const systemPrompt = configData?.find(c => c.key === `agent_${agentType}_prompt`)?.value
            || 'Você é um assistente útil.';

        if (!apiKey) return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 400 });

        // 2. Prompt Engineering (Strict JSON)
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

        // 3. Gemini Call
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `System: ${systemPrompt}\nUser: ${userPrompt}` }]
                }]
            })
        });

        const geminiData = await geminiResponse.json();
        const outputText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!outputText) throw new Error('No content from Gemini');

        // 4. Parse & Validate
        let data;
        try {
            const jsonMatch = outputText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            data = JSON.parse(jsonMatch[0]);
        } catch (e) {
            throw new Error(`Failed to parse JSON: ${outputText.substring(0, 50)}...`);
        }

        // 5. Duplicate Check
        const { data: existing } = await supabase
            .from('stories')
            .select('id')
            .eq('title', data.title)
            .maybeSingle();

        if (existing) {
            throw new Error(`Duplicate story: "${data.title}" already exists.`);
        }

        // 6. DB Transaction (Story -> Questions -> Options)
        // Insert Story
        const { data: story, error: storyError } = await supabase.from('stories').insert({
            title: data.title,
            content: data.content,
            moral: data.moral,
            category: data.category || 'Histórias',
            is_published: false,
            image_url: 'https://images.unsplash.com/photo-1507457379470-08b800de837a' // Placeholder
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

                if (qError) {
                    console.error("Failed to save question", qError);
                    continue;
                }

                if (q.options && Array.isArray(q.options)) {
                    const optionsPayload = q.options.map((opt: any) => ({
                        question_id: question.id,
                        text: opt.text,
                        is_correct: opt.is_correct
                    }));
                    await supabase.from('quiz_alternatives').insert(optionsPayload);
                }
            }
        }

        // 7. Log & Return
        await supabase.from('agent_logs').insert({
            action,
            performed_by: userId,
            status: 'success',
            input_summary: `Theme: ${theme}`,
            output_summary: `Created: ${data.title}`
        });

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
