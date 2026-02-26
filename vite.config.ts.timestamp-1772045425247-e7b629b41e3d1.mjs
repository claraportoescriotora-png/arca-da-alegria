var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/agent/flow.ts
var flow_exports = {};
__export(flow_exports, {
  config: () => config,
  default: () => handler
});
import { createClient } from "file:///C:/Users/Braga/Desktop/Arca%20da%20Alegria%20-%20Aplicativo%20Infantil%20Crist%C3%A3o/node_modules/@supabase/supabase-js/dist/index.mjs";
import sharp from "file:///C:/Users/Braga/Desktop/Arca%20da%20Alegria%20-%20Aplicativo%20Infantil%20Crist%C3%A3o/node_modules/sharp/lib/index.js";
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    console.log("--- Starting Agent Flow (Dynamic Model) ---");
    const body = req.body;
    const { action, agentType, params, userId, model } = body;
    console.log(`Action: ${action}, Agent: ${agentType}, Theme: ${params?.theme}, Requested Model: ${model}`);
    const keysToFetch = [
      "google_gemini_api_key",
      "google_gemini_model",
      `agent_${agentType}_prompt`,
      "openrouter_api_key",
      "groq_api_key",
      "cerebras_api_key"
    ];
    const { data: configData } = await supabase.from("agent_config").select("key, value").in("key", keysToFetch);
    const config2 = (key) => configData?.find((c) => c.key === key)?.value;
    const googleKey = config2("google_gemini_api_key");
    const openrouterKey = config2("openrouter_api_key");
    const groqKey = config2("groq_api_key");
    const cerebrasKey = config2("cerebras_api_key");
    const dbModel = config2("google_gemini_model");
    const selectedModel = model || dbModel || "gemini-flash-latest";
    const systemPrompt = config2(`agent_${agentType}_prompt`) || "Voc\xEA \xE9 um assistente \xFAtil.";
    if (action === "generate_story") {
      const theme = params?.theme || "Tema B\xEDblico Surpresa";
      const { data: existingStories } = await supabase.from("stories").select("title").order("created_at", { ascending: false }).limit(100);
      const existingTitles = existingStories?.map((s) => s.title).join(", ") || "Nenhum ainda";
      const jsonSchema = {
        title: "T\xEDtulo da Hist\xF3ria",
        moral: "Moral da hist\xF3ria em uma frase",
        category: "biblical | moral",
        content: "Texto completo da hist\xF3ria (min 3 par\xE1grafos)...",
        quiz: [
          {
            question: "Pergunta 1?",
            options: [
              { text: "Op\xE7\xE3o A", is_correct: false },
              { text: "Op\xE7\xE3o B (Certa)", is_correct: true },
              { text: "Op\xE7\xE3o C", is_correct: false }
            ]
          }
        ]
      };
      const userPrompt = `Crie uma hist\xF3ria infantil IN\xC9DITA sobre: ${theme}.
            
            IMPORTANTE - FIDELIDADE B\xCDBLICA:
            1. Se a categoria for 'biblical', voc\xEA deve seguir RIGOROSAMENTE o texto sagrado. 
            2. N\xC3O invente fatos, milagres ou eventos que n\xE3o est\xE3o na B\xEDblia. "In\xE9dita" significa uma nova forma de contar para crian\xE7as, n\xE3o inventar novos fatos.
            3. JAMAIS misture personagens ou locais de \xE9pocas diferentes (ex: No\xE9 n\xE3o viveu em Sodoma, Davi n\xE3o conheceu Mois\xE9s).
            4. Mantenha os personagens em seus contextos originais.

            IMPORTANTE - EVITE DUPLICIDADE:
            J\xE1 existem hist\xF3rias com os seguintes t\xEDtulos: [${existingTitles}].
            VOC\xCA N\xC3O PODE REPETIR NENHUM DESSES T\xCDTULOS. Crie algo novo e criativo. 
            Voc\xEA pode repetir personagens (ex: Daniel, No\xE9), mas o t\xEDtulo e o enredo devem ser diferentes das hist\xF3rias existentes.

            OBRIGAT\xD3RIO: Retorne APENAS um JSON v\xE1lido seguindo exatamente esta estrutura:
            ${JSON.stringify(jsonSchema)}
            
            Regras Adicionais:
            1. A hist\xF3ria deve ser doce, educativa e crist\xE3.
            2. O quiz deve ter 2 perguntas baseadas no texto gerado.
            3. A categoria deve ser 'biblical' (hist\xF3ria da B\xEDblia) ou 'moral' (educativa/cotidiana).`;
      let outputText = "";
      let providerUsed = "";
      if (selectedModel.includes("/") && openrouterKey) {
        providerUsed = "OpenRouter";
        console.log(`Calling OpenRouter: ${selectedModel}...`);
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://meuamiguito.com.br",
            "X-Title": "Amiguitos Agent"
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });
        const orData = await orRes.json();
        if (!orRes.ok) throw new Error(`OpenRouter Error: ${orData?.error?.message || "Unknown"}`);
        outputText = orData.choices?.[0]?.message?.content;
      } else if (selectedModel.startsWith("llama-") && groqKey) {
        providerUsed = "Groq";
        console.log(`Calling Groq: ${selectedModel}...`);
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });
        const groqData = await groqRes.json();
        if (!groqRes.ok) throw new Error(`Groq Error: ${groqData?.error?.message || "Unknown"}`);
        outputText = groqData.choices?.[0]?.message?.content;
      } else if (selectedModel === "llama3.1-70b" && cerebrasKey) {
        providerUsed = "Cerebras";
        console.log(`Calling Cerebras: ${selectedModel}...`);
        const cerRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cerebrasKey}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ]
          })
        });
        const cerData = await cerRes.json();
        if (!cerRes.ok) throw new Error(`Cerebras Error: ${JSON.stringify(cerData?.error || "Unknown")}`);
        outputText = cerData.choices?.[0]?.message?.content;
      } else {
        providerUsed = "Google Gemini";
        if (!googleKey) throw new Error("Google Gemini API Key missing");
        console.log(`Calling Google: ${selectedModel}...`);
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${googleKey}`;
        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `System: ${systemPrompt}
User: ${userPrompt}` }]
            }]
          })
        });
        const geminiData = await geminiResponse.json();
        if (!geminiResponse.ok) throw new Error(`Gemini Error: ${geminiData?.error?.message || "Unknown"}`);
        outputText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      }
      if (!outputText) throw new Error(`No content received from ${providerUsed}`);
      console.log(`Response received from ${providerUsed}.`);
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      const data = JSON.parse(jsonMatch[0]);
      console.log("Starting Image Flow...");
      let cover_url = "https://images.unsplash.com/photo-1507457379470-08b800de837a";
      try {
        const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${googleKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15e3);
        const imagenResponse = await fetch(imagenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            instances: [{ prompt: `Children book illustration, watercolor style, soft colors, high quality, Christian theme: ${data.title}` }],
            parameters: { sampleCount: 1 }
          })
        });
        clearTimeout(timeoutId);
        const imagenData = await imagenResponse.json();
        if (imagenResponse.ok && imagenData.predictions?.[0]?.bytesBase64Encoded) {
          console.log("Image received, optimizing...");
          const buffer = Buffer.from(imagenData.predictions[0].bytesBase64Encoded, "base64");
          let optimizedBuffer = await sharp(buffer).resize(800, 800, { fit: "inside" }).webp({ quality: 70 }).toBuffer();
          if (optimizedBuffer.length > 80 * 1024) {
            optimizedBuffer = await sharp(buffer).resize(600, 600, { fit: "inside" }).webp({ quality: 60 }).toBuffer();
          }
          const fileName = `story_${Date.now()}.webp`;
          const { error: uploadError } = await supabase.storage.from("stories").upload(fileName, optimizedBuffer, {
            contentType: "image/webp",
            cacheControl: "3600"
          });
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from("stories").getPublicUrl(fileName);
            cover_url = publicUrl;
          }
        }
      } catch (imgError) {
        console.warn("Image skip:", imgError.message);
      }
      console.log("Checking for duplicate title...");
      const { data: existingTitleCheck } = await supabase.from("stories").select("id").eq("title", data.title).single();
      if (existingTitleCheck) {
        throw new Error(`T\xEDtulo Duplicado: "${data.title}". A IA repetiu um t\xEDtulo que j\xE1 existe. Tente novamente.`);
      }
      console.log("Saving to Supabase...");
      let finalCategory = "biblical";
      const receivedCat = String(data.category).toLowerCase();
      if (receivedCat.includes("moral")) finalCategory = "moral";
      if (receivedCat.includes("biblical")) finalCategory = "biblical";
      const { data: story, error: storyError } = await supabase.from("stories").insert({
        title: data.title,
        content: data.content,
        moral: data.moral,
        category: finalCategory,
        cover_url,
        duration: "5 min",
        is_premium: true,
        // Standard for Arca
        audio_url: ""
      }).select().single();
      if (storyError) throw storyError;
      if (data.quiz && Array.isArray(data.quiz)) {
        for (const q of data.quiz) {
          const { data: question } = await supabase.from("quiz_questions").insert({
            content_id: story.id,
            question: q.question,
            order_index: 1
          }).select().single();
          if (question && q.options) {
            const optionsPayload = q.options.map((opt) => ({
              question_id: question.id,
              text: opt.text,
              is_correct: opt.is_correct
            }));
            await supabase.from("quiz_alternatives").insert(optionsPayload);
          }
        }
      }
      console.log("Flow completed successfully!");
      return res.status(200).json({ success: true, data: data.title });
    } else if (action === "list_models") {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`;
      const listResponse = await fetch(listUrl);
      const listData = await listResponse.json();
      return res.status(200).json({ success: true, models: listData.models || [] });
    }
  } catch (error) {
    console.error("Handler Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
var config, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, supabase;
var init_flow = __esm({
  "api/agent/flow.ts"() {
    config = {
      runtime: "nodejs",
      maxDuration: 60
    };
    SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
});

// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/Braga/Desktop/Arca%20da%20Alegria%20-%20Aplicativo%20Infantil%20Crist%C3%A3o/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Braga/Desktop/Arca%20da%20Alegria%20-%20Aplicativo%20Infantil%20Crist%C3%A3o/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\Braga\\Desktop\\Arca da Alegria - Aplicativo Infantil Crist\xE3o";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins: [
      react(),
      {
        name: "configure-server",
        configureServer(server) {
          server.middlewares.use("/api/agent/flow", async (req, res, next) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end("Method Not Allowed");
              return;
            }
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const bodyText = Buffer.concat(chunks).toString();
            try {
              Object.assign(process.env, env);
              const { default: handler2 } = await Promise.resolve().then(() => (init_flow(), flow_exports));
              const webReq = new Request("http://localhost:8080/api/agent/flow", {
                method: "POST",
                headers: req.headers,
                body: bodyText
              });
              const handlerFn = handler2;
              const webRes = await (handlerFn.length > 1 ? handlerFn(webReq, res) : handlerFn(webReq));
              if (!webRes) return;
              res.statusCode = webRes.status;
              webRes.headers.forEach((val, key) => res.setHeader(key, val));
              const responseText = await webRes.text();
              res.end(responseText);
            } catch (err) {
              console.error("API Proxy Error:", err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || "Unknown Error" }));
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBpL2FnZW50L2Zsb3cudHMiLCAidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxCcmFnYVxcXFxEZXNrdG9wXFxcXEFyY2EgZGEgQWxlZ3JpYSAtIEFwbGljYXRpdm8gSW5mYW50aWwgQ3Jpc3RcdTAwRTNvXFxcXGFwaVxcXFxhZ2VudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQnJhZ2FcXFxcRGVza3RvcFxcXFxBcmNhIGRhIEFsZWdyaWEgLSBBcGxpY2F0aXZvIEluZmFudGlsIENyaXN0XHUwMEUzb1xcXFxhcGlcXFxcYWdlbnRcXFxcZmxvdy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQnJhZ2EvRGVza3RvcC9BcmNhJTIwZGElMjBBbGVncmlhJTIwLSUyMEFwbGljYXRpdm8lMjBJbmZhbnRpbCUyMENyaXN0JUMzJUEzby9hcGkvYWdlbnQvZmxvdy50c1wiO1xyXG5pbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnO1xyXG4vLyBAdHMtaWdub3JlIC0gTG9jYWwgSURFIGNhY2hlIGlzc3VlLCB3b3JrcyBpbiBwcm9kdWN0aW9uXHJcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XHJcblxyXG5leHBvcnQgY29uc3QgY29uZmlnID0ge1xyXG4gICAgcnVudGltZTogJ25vZGVqcycsXHJcbiAgICBtYXhEdXJhdGlvbjogNjAsXHJcbn07XHJcblxyXG5jb25zdCBTVVBBQkFTRV9VUkwgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCE7XHJcbmNvbnN0IFNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkgPSBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZITtcclxuXHJcbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSk7XHJcblxyXG5pbnRlcmZhY2UgQWdlbnRSZXF1ZXN0IHtcclxuICAgIGFjdGlvbjogJ2dlbmVyYXRlX3N0b3J5JztcclxuICAgIGFnZW50VHlwZTogJ3N0b3J5dGVsbGVyJztcclxuICAgIHBhcmFtcz86IHtcclxuICAgICAgICB0aGVtZT86IHN0cmluZztcclxuICAgIH07XHJcbiAgICB1c2VySWQ/OiBzdHJpbmc7XHJcbiAgICBtb2RlbD86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXE6IGFueSwgcmVzOiBhbnkpIHtcclxuICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDUpLmpzb24oeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIi0tLSBTdGFydGluZyBBZ2VudCBGbG93IChEeW5hbWljIE1vZGVsKSAtLS1cIik7XHJcblxyXG4gICAgICAgIC8vIEluIFZlcmNlbCBOb2RlLmpzLCBib2R5IGlzIGFscmVhZHkgYSBwYXJzZWQgb2JqZWN0XHJcbiAgICAgICAgY29uc3QgYm9keSA9IHJlcS5ib2R5IGFzIEFnZW50UmVxdWVzdDtcclxuICAgICAgICBjb25zdCB7IGFjdGlvbiwgYWdlbnRUeXBlLCBwYXJhbXMsIHVzZXJJZCwgbW9kZWwgfSA9IGJvZHk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBBY3Rpb246ICR7YWN0aW9ufSwgQWdlbnQ6ICR7YWdlbnRUeXBlfSwgVGhlbWU6ICR7cGFyYW1zPy50aGVtZX0sIFJlcXVlc3RlZCBNb2RlbDogJHttb2RlbH1gKTtcclxuXHJcbiAgICAgICAgLy8gMS4gQ29uZmlnICYgQXV0aFxyXG4gICAgICAgIGNvbnN0IGtleXNUb0ZldGNoID0gW1xyXG4gICAgICAgICAgICAnZ29vZ2xlX2dlbWluaV9hcGlfa2V5JyxcclxuICAgICAgICAgICAgJ2dvb2dsZV9nZW1pbmlfbW9kZWwnLFxyXG4gICAgICAgICAgICBgYWdlbnRfJHthZ2VudFR5cGV9X3Byb21wdGAsXHJcbiAgICAgICAgICAgICdvcGVucm91dGVyX2FwaV9rZXknLFxyXG4gICAgICAgICAgICAnZ3JvcV9hcGlfa2V5JyxcclxuICAgICAgICAgICAgJ2NlcmVicmFzX2FwaV9rZXknXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBkYXRhOiBjb25maWdEYXRhIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgICAuZnJvbSgnYWdlbnRfY29uZmlnJylcclxuICAgICAgICAgICAgLnNlbGVjdCgna2V5LCB2YWx1ZScpXHJcbiAgICAgICAgICAgIC5pbigna2V5Jywga2V5c1RvRmV0Y2gpO1xyXG5cclxuICAgICAgICBjb25zdCBjb25maWcgPSAoa2V5OiBzdHJpbmcpID0+IGNvbmZpZ0RhdGE/LmZpbmQoYyA9PiBjLmtleSA9PT0ga2V5KT8udmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0IGdvb2dsZUtleSA9IGNvbmZpZygnZ29vZ2xlX2dlbWluaV9hcGlfa2V5Jyk7XHJcbiAgICAgICAgY29uc3Qgb3BlbnJvdXRlcktleSA9IGNvbmZpZygnb3BlbnJvdXRlcl9hcGlfa2V5Jyk7XHJcbiAgICAgICAgY29uc3QgZ3JvcUtleSA9IGNvbmZpZygnZ3JvcV9hcGlfa2V5Jyk7XHJcbiAgICAgICAgY29uc3QgY2VyZWJyYXNLZXkgPSBjb25maWcoJ2NlcmVicmFzX2FwaV9rZXknKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGJNb2RlbCA9IGNvbmZpZygnZ29vZ2xlX2dlbWluaV9tb2RlbCcpO1xyXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkTW9kZWwgPSBtb2RlbCB8fCBkYk1vZGVsIHx8ICdnZW1pbmktZmxhc2gtbGF0ZXN0JztcclxuICAgICAgICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBjb25maWcoYGFnZW50XyR7YWdlbnRUeXBlfV9wcm9tcHRgKSB8fCAnVm9jXHUwMEVBIFx1MDBFOSB1bSBhc3Npc3RlbnRlIFx1MDBGQXRpbC4nO1xyXG5cclxuICAgICAgICBpZiAoYWN0aW9uID09PSAnZ2VuZXJhdGVfc3RvcnknKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRoZW1lID0gcGFyYW1zPy50aGVtZSB8fCBcIlRlbWEgQlx1MDBFRGJsaWNvIFN1cnByZXNhXCI7XHJcblxyXG4gICAgICAgICAgICAvLyBGZXRjaCBleGlzdGluZyB0aXRsZXMgdG8gYXZvaWQgZHVwbGljYXRpb25cclxuICAgICAgICAgICAgY29uc3QgeyBkYXRhOiBleGlzdGluZ1N0b3JpZXMgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAgICAgICAuZnJvbSgnc3RvcmllcycpXHJcbiAgICAgICAgICAgICAgICAuc2VsZWN0KCd0aXRsZScpXHJcbiAgICAgICAgICAgICAgICAub3JkZXIoJ2NyZWF0ZWRfYXQnLCB7IGFzY2VuZGluZzogZmFsc2UgfSlcclxuICAgICAgICAgICAgICAgIC5saW1pdCgxMDApO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdUaXRsZXMgPSBleGlzdGluZ1N0b3JpZXM/Lm1hcChzID0+IHMudGl0bGUpLmpvaW4oJywgJykgfHwgJ05lbmh1bSBhaW5kYSc7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBqc29uU2NoZW1hID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiVFx1MDBFRHR1bG8gZGEgSGlzdFx1MDBGM3JpYVwiLFxyXG4gICAgICAgICAgICAgICAgbW9yYWw6IFwiTW9yYWwgZGEgaGlzdFx1MDBGM3JpYSBlbSB1bWEgZnJhc2VcIixcclxuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBcImJpYmxpY2FsIHwgbW9yYWxcIixcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFwiVGV4dG8gY29tcGxldG8gZGEgaGlzdFx1MDBGM3JpYSAobWluIDMgcGFyXHUwMEUxZ3JhZm9zKS4uLlwiLFxyXG4gICAgICAgICAgICAgICAgcXVpejogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcXVlc3Rpb246IFwiUGVyZ3VudGEgMT9cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiBcIk9wXHUwMEU3XHUwMEUzbyBBXCIsIGlzX2NvcnJlY3Q6IGZhbHNlIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHRleHQ6IFwiT3BcdTAwRTdcdTAwRTNvIEIgKENlcnRhKVwiLCBpc19jb3JyZWN0OiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHRleHQ6IFwiT3BcdTAwRTdcdTAwRTNvIENcIiwgaXNfY29ycmVjdDogZmFsc2UgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdXNlclByb21wdCA9IGBDcmllIHVtYSBoaXN0XHUwMEYzcmlhIGluZmFudGlsIElOXHUwMEM5RElUQSBzb2JyZTogJHt0aGVtZX0uXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBJTVBPUlRBTlRFIC0gRklERUxJREFERSBCXHUwMENEQkxJQ0E6XHJcbiAgICAgICAgICAgIDEuIFNlIGEgY2F0ZWdvcmlhIGZvciAnYmlibGljYWwnLCB2b2NcdTAwRUEgZGV2ZSBzZWd1aXIgUklHT1JPU0FNRU5URSBvIHRleHRvIHNhZ3JhZG8uIFxyXG4gICAgICAgICAgICAyLiBOXHUwMEMzTyBpbnZlbnRlIGZhdG9zLCBtaWxhZ3JlcyBvdSBldmVudG9zIHF1ZSBuXHUwMEUzbyBlc3RcdTAwRTNvIG5hIEJcdTAwRURibGlhLiBcIkluXHUwMEU5ZGl0YVwiIHNpZ25pZmljYSB1bWEgbm92YSBmb3JtYSBkZSBjb250YXIgcGFyYSBjcmlhblx1MDBFN2FzLCBuXHUwMEUzbyBpbnZlbnRhciBub3ZvcyBmYXRvcy5cclxuICAgICAgICAgICAgMy4gSkFNQUlTIG1pc3R1cmUgcGVyc29uYWdlbnMgb3UgbG9jYWlzIGRlIFx1MDBFOXBvY2FzIGRpZmVyZW50ZXMgKGV4OiBOb1x1MDBFOSBuXHUwMEUzbyB2aXZldSBlbSBTb2RvbWEsIERhdmkgblx1MDBFM28gY29uaGVjZXUgTW9pc1x1MDBFOXMpLlxyXG4gICAgICAgICAgICA0LiBNYW50ZW5oYSBvcyBwZXJzb25hZ2VucyBlbSBzZXVzIGNvbnRleHRvcyBvcmlnaW5haXMuXHJcblxyXG4gICAgICAgICAgICBJTVBPUlRBTlRFIC0gRVZJVEUgRFVQTElDSURBREU6XHJcbiAgICAgICAgICAgIEpcdTAwRTEgZXhpc3RlbSBoaXN0XHUwMEYzcmlhcyBjb20gb3Mgc2VndWludGVzIHRcdTAwRUR0dWxvczogWyR7ZXhpc3RpbmdUaXRsZXN9XS5cclxuICAgICAgICAgICAgVk9DXHUwMENBIE5cdTAwQzNPIFBPREUgUkVQRVRJUiBORU5IVU0gREVTU0VTIFRcdTAwQ0RUVUxPUy4gQ3JpZSBhbGdvIG5vdm8gZSBjcmlhdGl2by4gXHJcbiAgICAgICAgICAgIFZvY1x1MDBFQSBwb2RlIHJlcGV0aXIgcGVyc29uYWdlbnMgKGV4OiBEYW5pZWwsIE5vXHUwMEU5KSwgbWFzIG8gdFx1MDBFRHR1bG8gZSBvIGVucmVkbyBkZXZlbSBzZXIgZGlmZXJlbnRlcyBkYXMgaGlzdFx1MDBGM3JpYXMgZXhpc3RlbnRlcy5cclxuXHJcbiAgICAgICAgICAgIE9CUklHQVRcdTAwRDNSSU86IFJldG9ybmUgQVBFTkFTIHVtIEpTT04gdlx1MDBFMWxpZG8gc2VndWluZG8gZXhhdGFtZW50ZSBlc3RhIGVzdHJ1dHVyYTpcclxuICAgICAgICAgICAgJHtKU09OLnN0cmluZ2lmeShqc29uU2NoZW1hKX1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIFJlZ3JhcyBBZGljaW9uYWlzOlxyXG4gICAgICAgICAgICAxLiBBIGhpc3RcdTAwRjNyaWEgZGV2ZSBzZXIgZG9jZSwgZWR1Y2F0aXZhIGUgY3Jpc3RcdTAwRTMuXHJcbiAgICAgICAgICAgIDIuIE8gcXVpeiBkZXZlIHRlciAyIHBlcmd1bnRhcyBiYXNlYWRhcyBubyB0ZXh0byBnZXJhZG8uXHJcbiAgICAgICAgICAgIDMuIEEgY2F0ZWdvcmlhIGRldmUgc2VyICdiaWJsaWNhbCcgKGhpc3RcdTAwRjNyaWEgZGEgQlx1MDBFRGJsaWEpIG91ICdtb3JhbCcgKGVkdWNhdGl2YS9jb3RpZGlhbmEpLmA7XHJcblxyXG4gICAgICAgICAgICBsZXQgb3V0cHV0VGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgIGxldCBwcm92aWRlclVzZWQgPSBcIlwiO1xyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIFByb3ZpZGVyXHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZE1vZGVsLmluY2x1ZGVzKCcvJykgJiYgb3BlbnJvdXRlcktleSkge1xyXG4gICAgICAgICAgICAgICAgLy8gT3BlblJvdXRlclxyXG4gICAgICAgICAgICAgICAgcHJvdmlkZXJVc2VkID0gXCJPcGVuUm91dGVyXCI7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2FsbGluZyBPcGVuUm91dGVyOiAke3NlbGVjdGVkTW9kZWx9Li4uYCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvclJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL29wZW5yb3V0ZXIuYWkvYXBpL3YxL2NoYXQvY29tcGxldGlvbnMnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtvcGVucm91dGVyS2V5fWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdIVFRQLVJlZmVyZXInOiAnaHR0cHM6Ly9tZXVhbWlndWl0by5jb20uYnInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnWC1UaXRsZSc6ICdBbWlndWl0b3MgQWdlbnQnXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBzZWxlY3RlZE1vZGVsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyByb2xlOiAnc3lzdGVtJywgY29udGVudDogc3lzdGVtUHJvbXB0IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHJvbGU6ICd1c2VyJywgY29udGVudDogdXNlclByb21wdCB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogeyB0eXBlOiAnanNvbl9vYmplY3QnIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvckRhdGEgPSBhd2FpdCBvclJlcy5qc29uKCkgYXMgYW55O1xyXG4gICAgICAgICAgICAgICAgaWYgKCFvclJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBPcGVuUm91dGVyIEVycm9yOiAke29yRGF0YT8uZXJyb3I/Lm1lc3NhZ2UgfHwgXCJVbmtub3duXCJ9YCk7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXRUZXh0ID0gb3JEYXRhLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzZWxlY3RlZE1vZGVsLnN0YXJ0c1dpdGgoJ2xsYW1hLScpICYmIGdyb3FLZXkpIHtcclxuICAgICAgICAgICAgICAgIC8vIEdyb3FcclxuICAgICAgICAgICAgICAgIHByb3ZpZGVyVXNlZCA9IFwiR3JvcVwiO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENhbGxpbmcgR3JvcTogJHtzZWxlY3RlZE1vZGVsfS4uLmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvcVJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5ncm9xLmNvbS9vcGVuYWkvdjEvY2hhdC9jb21wbGV0aW9ucycsIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke2dyb3FLZXl9YFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogc2VsZWN0ZWRNb2RlbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IHN5c3RlbVByb21wdCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6IHVzZXJQcm9tcHQgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogJ2pzb25fb2JqZWN0JyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvcURhdGEgPSBhd2FpdCBncm9xUmVzLmpzb24oKSBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWdyb3FSZXMub2spIHRocm93IG5ldyBFcnJvcihgR3JvcSBFcnJvcjogJHtncm9xRGF0YT8uZXJyb3I/Lm1lc3NhZ2UgfHwgXCJVbmtub3duXCJ9YCk7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXRUZXh0ID0gZ3JvcURhdGEuY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNlbGVjdGVkTW9kZWwgPT09ICdsbGFtYTMuMS03MGInICYmIGNlcmVicmFzS2V5KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDZXJlYnJhc1xyXG4gICAgICAgICAgICAgICAgcHJvdmlkZXJVc2VkID0gXCJDZXJlYnJhc1wiO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENhbGxpbmcgQ2VyZWJyYXM6ICR7c2VsZWN0ZWRNb2RlbH0uLi5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlclJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5jZXJlYnJhcy5haS92MS9jaGF0L2NvbXBsZXRpb25zJywge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7Y2VyZWJyYXNLZXl9YFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogc2VsZWN0ZWRNb2RlbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IHN5c3RlbVByb21wdCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6IHVzZXJQcm9tcHQgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2VyRGF0YSA9IGF3YWl0IGNlclJlcy5qc29uKCkgYXMgYW55O1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjZXJSZXMub2spIHRocm93IG5ldyBFcnJvcihgQ2VyZWJyYXMgRXJyb3I6ICR7SlNPTi5zdHJpbmdpZnkoY2VyRGF0YT8uZXJyb3IgfHwgXCJVbmtub3duXCIpfWApO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0VGV4dCA9IGNlckRhdGEuY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRGVmYXVsdCB0byBHb29nbGUgR2VtaW5pRGlyZWN0XHJcbiAgICAgICAgICAgICAgICBwcm92aWRlclVzZWQgPSBcIkdvb2dsZSBHZW1pbmlcIjtcclxuICAgICAgICAgICAgICAgIGlmICghZ29vZ2xlS2V5KSB0aHJvdyBuZXcgRXJyb3IoXCJHb29nbGUgR2VtaW5pIEFQSSBLZXkgbWlzc2luZ1wiKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDYWxsaW5nIEdvb2dsZTogJHtzZWxlY3RlZE1vZGVsfS4uLmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ2VtaW5pVXJsID0gYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvJHtzZWxlY3RlZE1vZGVsfTpnZW5lcmF0ZUNvbnRlbnQ/a2V5PSR7Z29vZ2xlS2V5fWA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBnZW1pbmlSZXNwb25zZSA9IGF3YWl0IGZldGNoKGdlbWluaVVybCwge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudHM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0czogW3sgdGV4dDogYFN5c3RlbTogJHtzeXN0ZW1Qcm9tcHR9XFxuVXNlcjogJHt1c2VyUHJvbXB0fWAgfV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBnZW1pbmlEYXRhID0gYXdhaXQgZ2VtaW5pUmVzcG9uc2UuanNvbigpIGFzIGFueTtcclxuICAgICAgICAgICAgICAgIGlmICghZ2VtaW5pUmVzcG9uc2Uub2spIHRocm93IG5ldyBFcnJvcihgR2VtaW5pIEVycm9yOiAke2dlbWluaURhdGE/LmVycm9yPy5tZXNzYWdlIHx8IFwiVW5rbm93blwifWApO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0VGV4dCA9IGdlbWluaURhdGEuY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIW91dHB1dFRleHQpIHRocm93IG5ldyBFcnJvcihgTm8gY29udGVudCByZWNlaXZlZCBmcm9tICR7cHJvdmlkZXJVc2VkfWApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVzcG9uc2UgcmVjZWl2ZWQgZnJvbSAke3Byb3ZpZGVyVXNlZH0uYCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBqc29uTWF0Y2ggPSBvdXRwdXRUZXh0Lm1hdGNoKC9cXHtbXFxzXFxTXSpcXH0vKTtcclxuICAgICAgICAgICAgaWYgKCFqc29uTWF0Y2gpIHRocm93IG5ldyBFcnJvcihcIk5vIEpTT04gZm91bmQgaW4gcmVzcG9uc2VcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGpzb25NYXRjaFswXSk7XHJcblxyXG4gICAgICAgICAgICAvLyA1LiBJbWFnZSBHZW5lcmF0aW9uIChOb24tYmxvY2tpbmcgJiBUaW1lZClcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTdGFydGluZyBJbWFnZSBGbG93Li4uXCIpO1xyXG4gICAgICAgICAgICBsZXQgY292ZXJfdXJsID0gJ2h0dHBzOi8vaW1hZ2VzLnVuc3BsYXNoLmNvbS9waG90by0xNTA3NDU3Mzc5NDcwLTA4YjgwMGRlODM3YSc7IC8vIERlZmF1bHRcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZW5VcmwgPSBgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscy9pbWFnZW4tMy4wLWdlbmVyYXRlLTAwMTpwcmVkaWN0P2tleT0ke2dvb2dsZUtleX1gO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNldCBhIHN0cmljdCB0aW1lb3V0IGZvciBpbWFnZSBnZW5lcmF0aW9uIHRvIGF2b2lkIDUwNFxyXG4gICAgICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCAxNTAwMCk7IC8vIDE1cyBtYXggZm9yIGltYWdlXHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VuUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChpbWFnZW5VcmwsIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcclxuICAgICAgICAgICAgICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzOiBbeyBwcm9tcHQ6IGBDaGlsZHJlbiBib29rIGlsbHVzdHJhdGlvbiwgd2F0ZXJjb2xvciBzdHlsZSwgc29mdCBjb2xvcnMsIGhpZ2ggcXVhbGl0eSwgQ2hyaXN0aWFuIHRoZW1lOiAke2RhdGEudGl0bGV9YCB9XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyczogeyBzYW1wbGVDb3VudDogMSB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VuRGF0YSA9IGF3YWl0IGltYWdlblJlc3BvbnNlLmpzb24oKSBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW1hZ2VuUmVzcG9uc2Uub2sgJiYgaW1hZ2VuRGF0YS5wcmVkaWN0aW9ucz8uWzBdPy5ieXRlc0Jhc2U2NEVuY29kZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkltYWdlIHJlY2VpdmVkLCBvcHRpbWl6aW5nLi4uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGltYWdlbkRhdGEucHJlZGljdGlvbnNbMF0uYnl0ZXNCYXNlNjRFbmNvZGVkLCAnYmFzZTY0Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBvcHRpbWl6ZWRCdWZmZXIgPSBhd2FpdCBzaGFycChidWZmZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXNpemUoODAwLCA4MDAsIHsgZml0OiAnaW5zaWRlJyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAud2VicCh7IHF1YWxpdHk6IDcwIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC50b0J1ZmZlcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW1pemVkQnVmZmVyLmxlbmd0aCA+IDgwICogMTAyNCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpbWl6ZWRCdWZmZXIgPSBhd2FpdCBzaGFycChidWZmZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVzaXplKDYwMCwgNjAwLCB7IGZpdDogJ2luc2lkZScgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC53ZWJwKHsgcXVhbGl0eTogNjAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b0J1ZmZlcigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBgc3RvcnlfJHtEYXRlLm5vdygpfS53ZWJwYDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGVycm9yOiB1cGxvYWRFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2Uuc3RvcmFnZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZnJvbSgnc3RvcmllcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC51cGxvYWQoZmlsZU5hbWUsIG9wdGltaXplZEJ1ZmZlciwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdpbWFnZS93ZWJwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlQ29udHJvbDogJzM2MDAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXVwbG9hZEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogeyBwdWJsaWNVcmwgfSB9ID0gc3VwYWJhc2Uuc3RvcmFnZS5mcm9tKCdzdG9yaWVzJykuZ2V0UHVibGljVXJsKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY292ZXJfdXJsID0gcHVibGljVXJsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoaW1nRXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiSW1hZ2Ugc2tpcDpcIiwgaW1nRXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICAvLyBGYWxsYmFjayB0byBkZWZhdWx0XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIDYuIERCIEluc2VydGlvblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNoZWNraW5nIGZvciBkdXBsaWNhdGUgdGl0bGUuLi5cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogZXhpc3RpbmdUaXRsZUNoZWNrIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgICAgICAgLmZyb20oJ3N0b3JpZXMnKVxyXG4gICAgICAgICAgICAgICAgLnNlbGVjdCgnaWQnKVxyXG4gICAgICAgICAgICAgICAgLmVxKCd0aXRsZScsIGRhdGEudGl0bGUpXHJcbiAgICAgICAgICAgICAgICAuc2luZ2xlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdUaXRsZUNoZWNrKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRcdTAwRUR0dWxvIER1cGxpY2FkbzogXCIke2RhdGEudGl0bGV9XCIuIEEgSUEgcmVwZXRpdSB1bSB0XHUwMEVEdHVsbyBxdWUgalx1MDBFMSBleGlzdGUuIFRlbnRlIG5vdmFtZW50ZS5gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTYXZpbmcgdG8gU3VwYWJhc2UuLi5cIik7XHJcblxyXG4gICAgICAgICAgICAvLyBNYXAgY2F0ZWdvcnkgdG8gREIgY29uc3RyYWludFxyXG4gICAgICAgICAgICBsZXQgZmluYWxDYXRlZ29yeSA9ICdiaWJsaWNhbCc7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlY2VpdmVkQ2F0ID0gU3RyaW5nKGRhdGEuY2F0ZWdvcnkpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmIChyZWNlaXZlZENhdC5pbmNsdWRlcygnbW9yYWwnKSkgZmluYWxDYXRlZ29yeSA9ICdtb3JhbCc7XHJcbiAgICAgICAgICAgIGlmIChyZWNlaXZlZENhdC5pbmNsdWRlcygnYmlibGljYWwnKSkgZmluYWxDYXRlZ29yeSA9ICdiaWJsaWNhbCc7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB7IGRhdGE6IHN0b3J5LCBlcnJvcjogc3RvcnlFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuZnJvbSgnc3RvcmllcycpLmluc2VydCh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogZGF0YS50aXRsZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGRhdGEuY29udGVudCxcclxuICAgICAgICAgICAgICAgIG1vcmFsOiBkYXRhLm1vcmFsLFxyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6IGZpbmFsQ2F0ZWdvcnksXHJcbiAgICAgICAgICAgICAgICBjb3Zlcl91cmw6IGNvdmVyX3VybCxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAnNSBtaW4nLFxyXG4gICAgICAgICAgICAgICAgaXNfcHJlbWl1bTogdHJ1ZSwgLy8gU3RhbmRhcmQgZm9yIEFyY2FcclxuICAgICAgICAgICAgICAgIGF1ZGlvX3VybDogJydcclxuICAgICAgICAgICAgfSkuc2VsZWN0KCkuc2luZ2xlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RvcnlFcnJvcikgdGhyb3cgc3RvcnlFcnJvcjtcclxuXHJcbiAgICAgICAgICAgIC8vIDcuIFF1aXogSW5zZXJ0aW9uXHJcbiAgICAgICAgICAgIGlmIChkYXRhLnF1aXogJiYgQXJyYXkuaXNBcnJheShkYXRhLnF1aXopKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHEgb2YgZGF0YS5xdWl6KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBkYXRhOiBxdWVzdGlvbiB9ID0gYXdhaXQgc3VwYWJhc2UuZnJvbSgncXVpel9xdWVzdGlvbnMnKS5pbnNlcnQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50X2lkOiBzdG9yeS5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcXVlc3Rpb246IHEucXVlc3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yZGVyX2luZGV4OiAxXHJcbiAgICAgICAgICAgICAgICAgICAgfSkuc2VsZWN0KCkuc2luZ2xlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChxdWVzdGlvbiAmJiBxLm9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uc1BheWxvYWQgPSBxLm9wdGlvbnMubWFwKChvcHQ6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uX2lkOiBxdWVzdGlvbi5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IG9wdC50ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNfY29ycmVjdDogb3B0LmlzX2NvcnJlY3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzdXBhYmFzZS5mcm9tKCdxdWl6X2FsdGVybmF0aXZlcycpLmluc2VydChvcHRpb25zUGF5bG9hZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZsb3cgY29tcGxldGVkIHN1Y2Nlc3NmdWxseSFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGRhdGEudGl0bGUgfSk7XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnbGlzdF9tb2RlbHMnKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxpc3RVcmwgPSBgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscz9rZXk9JHtnb29nbGVLZXl9YDtcclxuICAgICAgICAgICAgY29uc3QgbGlzdFJlc3BvbnNlID0gYXdhaXQgZmV0Y2gobGlzdFVybCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGxpc3REYXRhID0gYXdhaXQgbGlzdFJlc3BvbnNlLmpzb24oKSBhcyBhbnk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUsIG1vZGVsczogbGlzdERhdGEubW9kZWxzIHx8IFtdIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkhhbmRsZXIgRXJyb3I6XCIsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xyXG4gICAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQnJhZ2FcXFxcRGVza3RvcFxcXFxBcmNhIGRhIEFsZWdyaWEgLSBBcGxpY2F0aXZvIEluZmFudGlsIENyaXN0XHUwMEUzb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQnJhZ2FcXFxcRGVza3RvcFxcXFxBcmNhIGRhIEFsZWdyaWEgLSBBcGxpY2F0aXZvIEluZmFudGlsIENyaXN0XHUwMEUzb1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQnJhZ2EvRGVza3RvcC9BcmNhJTIwZGElMjBBbGVncmlhJTIwLSUyMEFwbGljYXRpdm8lMjBJbmZhbnRpbCUyMENyaXN0JUMzJUEzby92aXRlLmNvbmZpZy50c1wiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBMb2FkIGVudiBmaWxlIGJhc2VkIG9uIGBtb2RlYCBpbiB0aGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeS5cbiAgLy8gU2V0IHRoZSB0aGlyZCBwYXJhbWV0ZXIgdG8gJycgdG8gbG9hZCBhbGwgZW52IHJlZ2FyZGxlc3Mgb2YgdGhlIGBWSVRFX2AgcHJlZml4LlxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcblxuICByZXR1cm4ge1xuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODA4MCxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdjb25maWd1cmUtc2VydmVyJyxcbiAgICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWdlbnQvZmxvdycsIGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNTtcbiAgICAgICAgICAgICAgcmVzLmVuZCgnTWV0aG9kIE5vdCBBbGxvd2VkJyk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2h1bmtzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIHtcbiAgICAgICAgICAgICAgY2h1bmtzLnB1c2goY2h1bmspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYm9keVRleHQgPSBCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgLy8gSW5qZWN0IEVudiBWYXJzIGludG8gcHJvY2Vzcy5lbnYgZm9yIHRoZSBoYW5kbGVyIHRvIHNlZVxuICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHByb2Nlc3MuZW52LCBlbnYpO1xuXG4gICAgICAgICAgICAgIC8vIER5bmFtaWMgaW1wb3J0XG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogaGFuZGxlciB9ID0gYXdhaXQgaW1wb3J0KCcuL2FwaS9hZ2VudC9mbG93LnRzJyk7XG5cbiAgICAgICAgICAgICAgLy8gTW9jayBSZXF1ZXN0XG4gICAgICAgICAgICAgIGNvbnN0IHdlYlJlcSA9IG5ldyBSZXF1ZXN0KCdodHRwOi8vbG9jYWxob3N0OjgwODAvYXBpL2FnZW50L2Zsb3cnLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMgYXMgYW55LFxuICAgICAgICAgICAgICAgIGJvZHk6IGJvZHlUZXh0XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIC8vIFRoZSBoYW5kbGVyIGluIGZsb3cudHMgZXhwZWN0cyAocmVxLCByZXMpIE5vZGUgc3R5bGVcbiAgICAgICAgICAgICAgLy8gQnV0IHdlIGNhbiBBTFNPIHRyeSB0byBjYWxsIGl0IHN0YW5kYXJkIHN0eWxlIGlmIGl0IHJldHVybnMgYSBSZXNwb25zZVxuICAgICAgICAgICAgICAvLyBUbyBmaXggdGhlIFwiRXhwZWN0ZWQgMiBhcmd1bWVudHNcIiBlcnJvciwgd2UgcHJvdmlkZSBhbiBlbXB0eSBtb2NrIGZvciByZXMgaWYgbmVlZGVkXG4gICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXJGbiA9IGhhbmRsZXIgYXMgYW55O1xuICAgICAgICAgICAgICBjb25zdCB3ZWJSZXMgPSBhd2FpdCAoaGFuZGxlckZuLmxlbmd0aCA+IDEgPyBoYW5kbGVyRm4od2ViUmVxLCByZXMpIDogaGFuZGxlckZuKHdlYlJlcSkpO1xuXG4gICAgICAgICAgICAgIC8vIElmIGhhbmRsZXIgYWxyZWFkeSBoYW5kbGVkIHRoZSByZXNwb25zZSAoTm9kZSBzdHlsZSksIHdlYlJlcyBtaWdodCBiZSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgaWYgKCF3ZWJSZXMpIHJldHVybjtcblxuICAgICAgICAgICAgICAvLyBNb2NrIFJlc3BvbnNlIChGZXRjaCBTdHlsZSlcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSB3ZWJSZXMuc3RhdHVzO1xuICAgICAgICAgICAgICAod2ViUmVzLmhlYWRlcnMgYXMgSGVhZGVycykuZm9yRWFjaCgodmFsOiBzdHJpbmcsIGtleTogc3RyaW5nKSA9PiByZXMuc2V0SGVhZGVyKGtleSwgdmFsKSk7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlVGV4dCA9IGF3YWl0IHdlYlJlcy50ZXh0KCk7XG4gICAgICAgICAgICAgIHJlcy5lbmQocmVzcG9uc2VUZXh0KTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSSBQcm94eSBFcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyPy5tZXNzYWdlIHx8IFwiVW5rbm93biBFcnJvclwiIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBLFNBQVMsb0JBQW9CO0FBRTdCLE9BQU8sV0FBVztBQXNCbEIsZUFBTyxRQUErQixLQUFVLEtBQVU7QUFDdEQsTUFBSSxJQUFJLFdBQVcsUUFBUTtBQUN2QixXQUFPLElBQUksT0FBTyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8scUJBQXFCLENBQUM7QUFBQSxFQUMvRDtBQUVBLE1BQUk7QUFDQSxZQUFRLElBQUksNkNBQTZDO0FBR3pELFVBQU0sT0FB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
