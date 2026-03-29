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

// api/import-drive-pdfs.ts
var import_drive_pdfs_exports = {};
__export(import_drive_pdfs_exports, {
  default: () => handler2
});
import { createClient as createClient2 } from "file:///C:/Users/Braga/Desktop/Arca%20da%20Alegria%20-%20Aplicativo%20Infantil%20Crist%C3%A3o/node_modules/@supabase/supabase-js/dist/index.mjs";
import * as crypto from "crypto";
function createJWT(serviceAccount) {
  const now = Math.floor(Date.now() / 1e3);
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signatureInput);
  sign.end();
  const signature = sign.sign(serviceAccount.private_key, "base64url");
  return `${signatureInput}.${signature}`;
}
async function getAccessToken(serviceAccount) {
  const jwt = createJWT(serviceAccount);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }
  const data = await response.json();
  return data.access_token;
}
function extractFolderId(url) {
  const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
async function listFilesInFolder(folderId, accessToken) {
  const url = `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType)",
    pageSize: "1000"
  });
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Drive API error: ${response.statusText} - ${error}`);
  }
  const data = await response.json();
  const files = [];
  const subfolders = [];
  for (const file of data.files || []) {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      subfolders.push({ id: file.id, name: file.name });
    } else if (file.mimeType === "application/pdf") {
      files.push({ id: file.id, name: file.name });
    }
  }
  return { files, subfolders };
}
async function processFolder(folderId, accessToken, category) {
  const { files, subfolders } = await listFilesInFolder(folderId, accessToken);
  const taggedFiles = files.map((f) => ({ ...f, category: category || "Geral" }));
  const subfolderFiles = [];
  for (const subfolder of subfolders) {
    const nestedFiles = await processFolder(subfolder.id, accessToken, subfolder.name);
    subfolderFiles.push(...nestedFiles);
  }
  return [...taggedFiles, ...subfolderFiles];
}
async function handler2(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized - Missing Token" });
  }
  const token = authHeader.split(" ")[1];
  const { data: { user }, error: authError } = await supabase2.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ success: false, error: "Unauthorized - Invalid Token" });
  }
  try {
    const { folderUrl } = req.body;
    if (!folderUrl) {
      return res.status(400).json({ success: false, error: "Folder URL is required" });
    }
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
    if (!credentials) {
      return res.status(500).json({
        success: false,
        error: "GOOGLE_SERVICE_ACCOUNT_CREDENTIALS not configured in environment variables"
      });
    }
    const serviceAccount = JSON.parse(credentials);
    const folderId = extractFolderId(folderUrl);
    if (!folderId) {
      return res.status(400).json({
        success: false,
        error: "Invalid Google Drive folder URL. Expected format: https://drive.google.com/drive/folders/[FOLDER_ID]"
      });
    }
    console.log(`Starting recursive import for folder: ${folderId}`);
    const accessToken = await getAccessToken(serviceAccount);
    const allFiles = await processFolder(folderId, accessToken);
    console.log(`Found ${allFiles.length} PDF files across all folders`);
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];
    console.log(`Starting DB insertion for ${allFiles.length} files...`);
    for (const file of allFiles) {
      try {
        const { data: existing, error: checkError } = await supabase2.from("activities").select("id").eq("file_id", file.id).maybeSingle();
        if (checkError) {
          console.error(`Check error for ${file.name}:`, checkError);
          errors.push(`Check failed: ${file.name} - ${checkError.message}`);
          continue;
        }
        if (existing) {
          console.log(`Skipping existing file: ${file.name}`);
          skippedCount++;
          continue;
        }
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
        const title = file.name.replace(".pdf", "").replace(/[-_]/g, " ");
        const insertData = {
          title,
          description: `Importado do Google Drive - ${file.category}`,
          type: "coloring",
          category: file.category || "Geral",
          file_id: file.id,
          pdf_url: downloadUrl,
          image_url: null,
          is_active: true
        };
        console.log(`Inserting: ${file.name}`, insertData);
        const { data: inserted, error: insertError } = await supabase2.from("activities").insert(insertData).select();
        if (insertError) {
          console.error(`Insert error for ${file.name}:`, insertError);
          errors.push(`Insert failed: ${file.name} - ${insertError.message}`);
        } else {
          console.log(`Successfully inserted: ${file.name}`);
          importedCount++;
        }
      } catch (err) {
        console.error(`Exception processing ${file.name}:`, err);
        errors.push(`Exception: ${file.name} - ${err.message}`);
      }
    }
    console.log(`Import complete. Imported: ${importedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`);
    return res.status(200).json({
      success: true,
      imported: importedCount,
      totalFound: allFiles.length,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : void 0,
      message: `\u2705 Importa\xE7\xE3o conclu\xEDda! Encontrados: ${allFiles.length} PDFs. Novos: ${importedCount}. J\xE1 existentes: ${skippedCount}.${errors.length > 0 ? ` Erros: ${errors.length}` : ""}`
    });
  } catch (error) {
    console.error("CRITICAL HANDLER ERROR:", error);
    return res.status(200).json({
      success: false,
      error: error.message || "Unknown server error",
      hint: error.message?.includes("GOOGLE_SERVICE_ACCOUNT") ? "Configure GOOGLE_SERVICE_ACCOUNT_CREDENTIALS na Vercel com o JSON da Service Account" : error.message?.includes("access token") ? "Verifique se as credenciais da Service Account est\xE3o corretas" : "Verifique se a Service Account tem permiss\xE3o de leitura na pasta do Drive (compartilhe a pasta com o email da Service Account)"
    });
  }
}
var supabaseUrl, supabaseKey, supabase2;
var init_import_drive_pdfs = __esm({
  "api/import-drive-pdfs.ts"() {
    supabaseUrl = process.env.VITE_SUPABASE_URL || "";
    supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    supabase2 = createClient2(supabaseUrl, supabaseKey);
  }
});

// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/Braga/Desktop/Arca%20da%20Alegria%20-%20Aplicativo%20Infantil%20Crist%C3%A3o/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Braga/Desktop/Arca%20da%20Alegria%20-%20Aplicativo%20Infantil%20Crist%C3%A3o/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { VitePWA } from "file:///C:/Users/Braga/Desktop/Arca%20da%20Alegria%20-%20Aplicativo%20Infantil%20Crist%C3%A3o/node_modules/vite-plugin-pwa/dist/index.js";
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
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        // No registerType = VitePWA won't generate or inject registerSW.js
        // SW registration is handled manually in main.tsx via requestIdleCallback
        devOptions: {
          enabled: true,
          type: "module"
        },
        manifest: {
          name: "Arca da Alegria",
          short_name: "Arca",
          description: "Aplicativo Infantil Crist\xE3o",
          theme_color: "#0f172a",
          background_color: "#0f172a",
          display: "standalone",
          icons: [
            {
              src: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp",
              sizes: "192x192",
              type: "image/webp"
            },
            {
              src: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp",
              sizes: "512x512",
              type: "image/webp"
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"]
        }
      }),
      // Definitive fix: mark registerSW.js as async AND make main CSS non-blocking via writeBundle
      // (catches VitePWA's late-stage injection that bypasses transformIndexHtml)
      {
        name: "async-register-sw",
        enforce: "post",
        apply: "build",
        transformIndexHtml: {
          order: "post",
          handler(html) {
            return html.replace(
              /(<script\b[^>]*\bsrc="[^"]*registerSW\.js"[^>]*)>/gi,
              "$1 async>"
            );
          }
        },
        async writeBundle(options) {
          const fs = await import("fs");
          const path2 = await import("path");
          const outDir = options.dir || "dist";
          const htmlFile = path2.join(outDir, "index.html");
          if (fs.existsSync(htmlFile)) {
            let html = fs.readFileSync(htmlFile, "utf-8");
            html = html.replace(
              /(<script\b[^>]*\bsrc="[^"]*registerSW\.js"[^>]*)>/gi,
              "$1 async>"
            );
            html = html.replace(
              /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/g,
              `<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" href="$1"><noscript><link rel="stylesheet" href="$1"></noscript>`
            );
            fs.writeFileSync(htmlFile, html, "utf-8");
            console.log("[async-register-sw] Patched dist/index.html: registerSW async + CSS non-blocking");
          }
        }
      },
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
              const { default: handler3 } = await Promise.resolve().then(() => (init_flow(), flow_exports));
              const webReq = new Request("http://localhost:8080/api/agent/flow", {
                method: "POST",
                headers: req.headers,
                body: bodyText
              });
              const handlerFn = handler3;
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
          server.middlewares.use("/api/import-drive-pdfs", async (req, res, next) => {
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
              const { default: handler3 } = await Promise.resolve().then(() => (init_import_drive_pdfs(), import_drive_pdfs_exports));
              const webReq = new Request("http://localhost:8080/api/import-drive-pdfs", {
                method: "POST",
                headers: req.headers,
                body: bodyText
              });
              const handlerFn = handler3;
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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("@supabase") || id.includes("lucide-react") || id.includes("@radix-ui") || id.includes("@tanstack")) {
                return "vendor-libs";
              }
              return "vendor";
            }
          }
        }
      }
    },
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBpL2FnZW50L2Zsb3cudHMiLCAiYXBpL2ltcG9ydC1kcml2ZS1wZGZzLnRzIiwgInZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQnJhZ2FcXFxcRGVza3RvcFxcXFxBcmNhIGRhIEFsZWdyaWEgLSBBcGxpY2F0aXZvIEluZmFudGlsIENyaXN0XHUwMEUzb1xcXFxhcGlcXFxcYWdlbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEJyYWdhXFxcXERlc2t0b3BcXFxcQXJjYSBkYSBBbGVncmlhIC0gQXBsaWNhdGl2byBJbmZhbnRpbCBDcmlzdFx1MDBFM29cXFxcYXBpXFxcXGFnZW50XFxcXGZsb3cudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0JyYWdhL0Rlc2t0b3AvQXJjYSUyMGRhJTIwQWxlZ3JpYSUyMC0lMjBBcGxpY2F0aXZvJTIwSW5mYW50aWwlMjBDcmlzdCVDMyVBM28vYXBpL2FnZW50L2Zsb3cudHNcIjtcclxuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJztcclxuLy8gQHRzLWlnbm9yZSAtIExvY2FsIElERSBjYWNoZSBpc3N1ZSwgd29ya3MgaW4gcHJvZHVjdGlvblxyXG5pbXBvcnQgc2hhcnAgZnJvbSAnc2hhcnAnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcclxuICAgIHJ1bnRpbWU6ICdub2RlanMnLFxyXG4gICAgbWF4RHVyYXRpb246IDYwLFxyXG59O1xyXG5cclxuY29uc3QgU1VQQUJBU0VfVVJMID0gcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwhO1xyXG5jb25zdCBTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSE7XHJcblxyXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChTVVBBQkFTRV9VUkwsIFNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkpO1xyXG5cclxuaW50ZXJmYWNlIEFnZW50UmVxdWVzdCB7XHJcbiAgICBhY3Rpb246ICdnZW5lcmF0ZV9zdG9yeSc7XHJcbiAgICBhZ2VudFR5cGU6ICdzdG9yeXRlbGxlcic7XHJcbiAgICBwYXJhbXM/OiB7XHJcbiAgICAgICAgdGhlbWU/OiBzdHJpbmc7XHJcbiAgICB9O1xyXG4gICAgdXNlcklkPzogc3RyaW5nO1xyXG4gICAgbW9kZWw/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxOiBhbnksIHJlczogYW55KSB7XHJcbiAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCItLS0gU3RhcnRpbmcgQWdlbnQgRmxvdyAoRHluYW1pYyBNb2RlbCkgLS0tXCIpO1xyXG5cclxuICAgICAgICAvLyBJbiBWZXJjZWwgTm9kZS5qcywgYm9keSBpcyBhbHJlYWR5IGEgcGFyc2VkIG9iamVjdFxyXG4gICAgICAgIGNvbnN0IGJvZHkgPSByZXEuYm9keSBhcyBBZ2VudFJlcXVlc3Q7XHJcbiAgICAgICAgY29uc3QgeyBhY3Rpb24sIGFnZW50VHlwZSwgcGFyYW1zLCB1c2VySWQsIG1vZGVsIH0gPSBib2R5O1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhgQWN0aW9uOiAke2FjdGlvbn0sIEFnZW50OiAke2FnZW50VHlwZX0sIFRoZW1lOiAke3BhcmFtcz8udGhlbWV9LCBSZXF1ZXN0ZWQgTW9kZWw6ICR7bW9kZWx9YCk7XHJcblxyXG4gICAgICAgIC8vIDEuIENvbmZpZyAmIEF1dGhcclxuICAgICAgICBjb25zdCBrZXlzVG9GZXRjaCA9IFtcclxuICAgICAgICAgICAgJ2dvb2dsZV9nZW1pbmlfYXBpX2tleScsXHJcbiAgICAgICAgICAgICdnb29nbGVfZ2VtaW5pX21vZGVsJyxcclxuICAgICAgICAgICAgYGFnZW50XyR7YWdlbnRUeXBlfV9wcm9tcHRgLFxyXG4gICAgICAgICAgICAnb3BlbnJvdXRlcl9hcGlfa2V5JyxcclxuICAgICAgICAgICAgJ2dyb3FfYXBpX2tleScsXHJcbiAgICAgICAgICAgICdjZXJlYnJhc19hcGlfa2V5J1xyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGNvbnN0IHsgZGF0YTogY29uZmlnRGF0YSB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgICAgLmZyb20oJ2FnZW50X2NvbmZpZycpXHJcbiAgICAgICAgICAgIC5zZWxlY3QoJ2tleSwgdmFsdWUnKVxyXG4gICAgICAgICAgICAuaW4oJ2tleScsIGtleXNUb0ZldGNoKTtcclxuXHJcbiAgICAgICAgY29uc3QgY29uZmlnID0gKGtleTogc3RyaW5nKSA9PiBjb25maWdEYXRhPy5maW5kKGMgPT4gYy5rZXkgPT09IGtleSk/LnZhbHVlO1xyXG5cclxuICAgICAgICBjb25zdCBnb29nbGVLZXkgPSBjb25maWcoJ2dvb2dsZV9nZW1pbmlfYXBpX2tleScpO1xyXG4gICAgICAgIGNvbnN0IG9wZW5yb3V0ZXJLZXkgPSBjb25maWcoJ29wZW5yb3V0ZXJfYXBpX2tleScpO1xyXG4gICAgICAgIGNvbnN0IGdyb3FLZXkgPSBjb25maWcoJ2dyb3FfYXBpX2tleScpO1xyXG4gICAgICAgIGNvbnN0IGNlcmVicmFzS2V5ID0gY29uZmlnKCdjZXJlYnJhc19hcGlfa2V5Jyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRiTW9kZWwgPSBjb25maWcoJ2dvb2dsZV9nZW1pbmlfbW9kZWwnKTtcclxuICAgICAgICBjb25zdCBzZWxlY3RlZE1vZGVsID0gbW9kZWwgfHwgZGJNb2RlbCB8fCAnZ2VtaW5pLWZsYXNoLWxhdGVzdCc7XHJcbiAgICAgICAgY29uc3Qgc3lzdGVtUHJvbXB0ID0gY29uZmlnKGBhZ2VudF8ke2FnZW50VHlwZX1fcHJvbXB0YCkgfHwgJ1ZvY1x1MDBFQSBcdTAwRTkgdW0gYXNzaXN0ZW50ZSBcdTAwRkF0aWwuJztcclxuXHJcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2dlbmVyYXRlX3N0b3J5Jykge1xyXG4gICAgICAgICAgICBjb25zdCB0aGVtZSA9IHBhcmFtcz8udGhlbWUgfHwgXCJUZW1hIEJcdTAwRURibGljbyBTdXJwcmVzYVwiO1xyXG5cclxuICAgICAgICAgICAgLy8gRmV0Y2ggZXhpc3RpbmcgdGl0bGVzIHRvIGF2b2lkIGR1cGxpY2F0aW9uXHJcbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogZXhpc3RpbmdTdG9yaWVzIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgICAgICAgLmZyb20oJ3N0b3JpZXMnKVxyXG4gICAgICAgICAgICAgICAgLnNlbGVjdCgndGl0bGUnKVxyXG4gICAgICAgICAgICAgICAgLm9yZGVyKCdjcmVhdGVkX2F0JywgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXHJcbiAgICAgICAgICAgICAgICAubGltaXQoMTAwKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVGl0bGVzID0gZXhpc3RpbmdTdG9yaWVzPy5tYXAocyA9PiBzLnRpdGxlKS5qb2luKCcsICcpIHx8ICdOZW5odW0gYWluZGEnO1xyXG5cclxuICAgICAgICAgICAgY29uc3QganNvblNjaGVtYSA9IHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlRcdTAwRUR0dWxvIGRhIEhpc3RcdTAwRjNyaWFcIixcclxuICAgICAgICAgICAgICAgIG1vcmFsOiBcIk1vcmFsIGRhIGhpc3RcdTAwRjNyaWEgZW0gdW1hIGZyYXNlXCIsXHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogXCJiaWJsaWNhbCB8IG1vcmFsXCIsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBcIlRleHRvIGNvbXBsZXRvIGRhIGhpc3RcdTAwRjNyaWEgKG1pbiAzIHBhclx1MDBFMWdyYWZvcykuLi5cIixcclxuICAgICAgICAgICAgICAgIHF1aXo6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBcIlBlcmd1bnRhIDE/XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdGV4dDogXCJPcFx1MDBFN1x1MDBFM28gQVwiLCBpc19jb3JyZWN0OiBmYWxzZSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiBcIk9wXHUwMEU3XHUwMEUzbyBCIChDZXJ0YSlcIiwgaXNfY29ycmVjdDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiBcIk9wXHUwMEU3XHUwMEUzbyBDXCIsIGlzX2NvcnJlY3Q6IGZhbHNlIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHVzZXJQcm9tcHQgPSBgQ3JpZSB1bWEgaGlzdFx1MDBGM3JpYSBpbmZhbnRpbCBJTlx1MDBDOURJVEEgc29icmU6ICR7dGhlbWV9LlxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgSU1QT1JUQU5URSAtIEZJREVMSURBREUgQlx1MDBDREJMSUNBOlxyXG4gICAgICAgICAgICAxLiBTZSBhIGNhdGVnb3JpYSBmb3IgJ2JpYmxpY2FsJywgdm9jXHUwMEVBIGRldmUgc2VndWlyIFJJR09ST1NBTUVOVEUgbyB0ZXh0byBzYWdyYWRvLiBcclxuICAgICAgICAgICAgMi4gTlx1MDBDM08gaW52ZW50ZSBmYXRvcywgbWlsYWdyZXMgb3UgZXZlbnRvcyBxdWUgblx1MDBFM28gZXN0XHUwMEUzbyBuYSBCXHUwMEVEYmxpYS4gXCJJblx1MDBFOWRpdGFcIiBzaWduaWZpY2EgdW1hIG5vdmEgZm9ybWEgZGUgY29udGFyIHBhcmEgY3JpYW5cdTAwRTdhcywgblx1MDBFM28gaW52ZW50YXIgbm92b3MgZmF0b3MuXHJcbiAgICAgICAgICAgIDMuIEpBTUFJUyBtaXN0dXJlIHBlcnNvbmFnZW5zIG91IGxvY2FpcyBkZSBcdTAwRTlwb2NhcyBkaWZlcmVudGVzIChleDogTm9cdTAwRTkgblx1MDBFM28gdml2ZXUgZW0gU29kb21hLCBEYXZpIG5cdTAwRTNvIGNvbmhlY2V1IE1vaXNcdTAwRTlzKS5cclxuICAgICAgICAgICAgNC4gTWFudGVuaGEgb3MgcGVyc29uYWdlbnMgZW0gc2V1cyBjb250ZXh0b3Mgb3JpZ2luYWlzLlxyXG5cclxuICAgICAgICAgICAgSU1QT1JUQU5URSAtIEVWSVRFIERVUExJQ0lEQURFOlxyXG4gICAgICAgICAgICBKXHUwMEUxIGV4aXN0ZW0gaGlzdFx1MDBGM3JpYXMgY29tIG9zIHNlZ3VpbnRlcyB0XHUwMEVEdHVsb3M6IFske2V4aXN0aW5nVGl0bGVzfV0uXHJcbiAgICAgICAgICAgIFZPQ1x1MDBDQSBOXHUwMEMzTyBQT0RFIFJFUEVUSVIgTkVOSFVNIERFU1NFUyBUXHUwMENEVFVMT1MuIENyaWUgYWxnbyBub3ZvIGUgY3JpYXRpdm8uIFxyXG4gICAgICAgICAgICBWb2NcdTAwRUEgcG9kZSByZXBldGlyIHBlcnNvbmFnZW5zIChleDogRGFuaWVsLCBOb1x1MDBFOSksIG1hcyBvIHRcdTAwRUR0dWxvIGUgbyBlbnJlZG8gZGV2ZW0gc2VyIGRpZmVyZW50ZXMgZGFzIGhpc3RcdTAwRjNyaWFzIGV4aXN0ZW50ZXMuXHJcblxyXG4gICAgICAgICAgICBPQlJJR0FUXHUwMEQzUklPOiBSZXRvcm5lIEFQRU5BUyB1bSBKU09OIHZcdTAwRTFsaWRvIHNlZ3VpbmRvIGV4YXRhbWVudGUgZXN0YSBlc3RydXR1cmE6XHJcbiAgICAgICAgICAgICR7SlNPTi5zdHJpbmdpZnkoanNvblNjaGVtYSl9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBSZWdyYXMgQWRpY2lvbmFpczpcclxuICAgICAgICAgICAgMS4gQSBoaXN0XHUwMEYzcmlhIGRldmUgc2VyIGRvY2UsIGVkdWNhdGl2YSBlIGNyaXN0XHUwMEUzLlxyXG4gICAgICAgICAgICAyLiBPIHF1aXogZGV2ZSB0ZXIgMiBwZXJndW50YXMgYmFzZWFkYXMgbm8gdGV4dG8gZ2VyYWRvLlxyXG4gICAgICAgICAgICAzLiBBIGNhdGVnb3JpYSBkZXZlIHNlciAnYmlibGljYWwnIChoaXN0XHUwMEYzcmlhIGRhIEJcdTAwRURibGlhKSBvdSAnbW9yYWwnIChlZHVjYXRpdmEvY290aWRpYW5hKS5gO1xyXG5cclxuICAgICAgICAgICAgbGV0IG91dHB1dFRleHQgPSBcIlwiO1xyXG4gICAgICAgICAgICBsZXQgcHJvdmlkZXJVc2VkID0gXCJcIjtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSBQcm92aWRlclxyXG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWRNb2RlbC5pbmNsdWRlcygnLycpICYmIG9wZW5yb3V0ZXJLZXkpIHtcclxuICAgICAgICAgICAgICAgIC8vIE9wZW5Sb3V0ZXJcclxuICAgICAgICAgICAgICAgIHByb3ZpZGVyVXNlZCA9IFwiT3BlblJvdXRlclwiO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENhbGxpbmcgT3BlblJvdXRlcjogJHtzZWxlY3RlZE1vZGVsfS4uLmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3JSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9vcGVucm91dGVyLmFpL2FwaS92MS9jaGF0L2NvbXBsZXRpb25zJywge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7b3BlbnJvdXRlcktleX1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnSFRUUC1SZWZlcmVyJzogJ2h0dHBzOi8vbWV1YW1pZ3VpdG8uY29tLmJyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ1gtVGl0bGUnOiAnQW1pZ3VpdG9zIEFnZW50J1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogc2VsZWN0ZWRNb2RlbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IHN5c3RlbVByb21wdCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6IHVzZXJQcm9tcHQgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogJ2pzb25fb2JqZWN0JyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3JEYXRhID0gYXdhaXQgb3JSZXMuanNvbigpIGFzIGFueTtcclxuICAgICAgICAgICAgICAgIGlmICghb3JSZXMub2spIHRocm93IG5ldyBFcnJvcihgT3BlblJvdXRlciBFcnJvcjogJHtvckRhdGE/LmVycm9yPy5tZXNzYWdlIHx8IFwiVW5rbm93blwifWApO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0VGV4dCA9IG9yRGF0YS5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsZWN0ZWRNb2RlbC5zdGFydHNXaXRoKCdsbGFtYS0nKSAmJiBncm9xS2V5KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHcm9xXHJcbiAgICAgICAgICAgICAgICBwcm92aWRlclVzZWQgPSBcIkdyb3FcIjtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDYWxsaW5nIEdyb3E6ICR7c2VsZWN0ZWRNb2RlbH0uLi5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3FSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkuZ3JvcS5jb20vb3BlbmFpL3YxL2NoYXQvY29tcGxldGlvbnMnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtncm9xS2V5fWBcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IHNlbGVjdGVkTW9kZWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHJvbGU6ICdzeXN0ZW0nLCBjb250ZW50OiBzeXN0ZW1Qcm9tcHQgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiB1c2VyUHJvbXB0IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VfZm9ybWF0OiB7IHR5cGU6ICdqc29uX29iamVjdCcgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3FEYXRhID0gYXdhaXQgZ3JvcVJlcy5qc29uKCkgYXMgYW55O1xyXG4gICAgICAgICAgICAgICAgaWYgKCFncm9xUmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEdyb3EgRXJyb3I6ICR7Z3JvcURhdGE/LmVycm9yPy5tZXNzYWdlIHx8IFwiVW5rbm93blwifWApO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0VGV4dCA9IGdyb3FEYXRhLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzZWxlY3RlZE1vZGVsID09PSAnbGxhbWEzLjEtNzBiJyAmJiBjZXJlYnJhc0tleSkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2VyZWJyYXNcclxuICAgICAgICAgICAgICAgIHByb3ZpZGVyVXNlZCA9IFwiQ2VyZWJyYXNcIjtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDYWxsaW5nIENlcmVicmFzOiAke3NlbGVjdGVkTW9kZWx9Li4uYCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjZXJSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkuY2VyZWJyYXMuYWkvdjEvY2hhdC9jb21wbGV0aW9ucycsIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke2NlcmVicmFzS2V5fWBcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IHNlbGVjdGVkTW9kZWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHJvbGU6ICdzeXN0ZW0nLCBjb250ZW50OiBzeXN0ZW1Qcm9tcHQgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiB1c2VyUHJvbXB0IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlckRhdGEgPSBhd2FpdCBjZXJSZXMuanNvbigpIGFzIGFueTtcclxuICAgICAgICAgICAgICAgIGlmICghY2VyUmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoYENlcmVicmFzIEVycm9yOiAke0pTT04uc3RyaW5naWZ5KGNlckRhdGE/LmVycm9yIHx8IFwiVW5rbm93blwiKX1gKTtcclxuICAgICAgICAgICAgICAgIG91dHB1dFRleHQgPSBjZXJEYXRhLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgdG8gR29vZ2xlIEdlbWluaURpcmVjdFxyXG4gICAgICAgICAgICAgICAgcHJvdmlkZXJVc2VkID0gXCJHb29nbGUgR2VtaW5pXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWdvb2dsZUtleSkgdGhyb3cgbmV3IEVycm9yKFwiR29vZ2xlIEdlbWluaSBBUEkgS2V5IG1pc3NpbmdcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2FsbGluZyBHb29nbGU6ICR7c2VsZWN0ZWRNb2RlbH0uLi5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGdlbWluaVVybCA9IGBodHRwczovL2dlbmVyYXRpdmVsYW5ndWFnZS5nb29nbGVhcGlzLmNvbS92MWJldGEvbW9kZWxzLyR7c2VsZWN0ZWRNb2RlbH06Z2VuZXJhdGVDb250ZW50P2tleT0ke2dvb2dsZUtleX1gO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ2VtaW5pUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChnZW1pbmlVcmwsIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcclxuICAgICAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRzOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydHM6IFt7IHRleHQ6IGBTeXN0ZW06ICR7c3lzdGVtUHJvbXB0fVxcblVzZXI6ICR7dXNlclByb21wdH1gIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ2VtaW5pRGF0YSA9IGF3YWl0IGdlbWluaVJlc3BvbnNlLmpzb24oKSBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWdlbWluaVJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEdlbWluaSBFcnJvcjogJHtnZW1pbmlEYXRhPy5lcnJvcj8ubWVzc2FnZSB8fCBcIlVua25vd25cIn1gKTtcclxuICAgICAgICAgICAgICAgIG91dHB1dFRleHQgPSBnZW1pbmlEYXRhLmNhbmRpZGF0ZXM/LlswXT8uY29udGVudD8ucGFydHM/LlswXT8udGV4dDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFvdXRwdXRUZXh0KSB0aHJvdyBuZXcgRXJyb3IoYE5vIGNvbnRlbnQgcmVjZWl2ZWQgZnJvbSAke3Byb3ZpZGVyVXNlZH1gKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFJlc3BvbnNlIHJlY2VpdmVkIGZyb20gJHtwcm92aWRlclVzZWR9LmApO1xyXG5cclxuICAgICAgICAgICAgY29uc3QganNvbk1hdGNoID0gb3V0cHV0VGV4dC5tYXRjaCgvXFx7W1xcc1xcU10qXFx9Lyk7XHJcbiAgICAgICAgICAgIGlmICghanNvbk1hdGNoKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBKU09OIGZvdW5kIGluIHJlc3BvbnNlXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShqc29uTWF0Y2hbMF0pO1xyXG5cclxuICAgICAgICAgICAgLy8gNS4gSW1hZ2UgR2VuZXJhdGlvbiAoTm9uLWJsb2NraW5nICYgVGltZWQpXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3RhcnRpbmcgSW1hZ2UgRmxvdy4uLlwiKTtcclxuICAgICAgICAgICAgbGV0IGNvdmVyX3VybCA9ICdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8tMTUwNzQ1NzM3OTQ3MC0wOGI4MDBkZTgzN2EnOyAvLyBEZWZhdWx0XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VuVXJsID0gYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvaW1hZ2VuLTMuMC1nZW5lcmF0ZS0wMDE6cHJlZGljdD9rZXk9JHtnb29nbGVLZXl9YDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZXQgYSBzdHJpY3QgdGltZW91dCBmb3IgaW1hZ2UgZ2VuZXJhdGlvbiB0byBhdm9pZCA1MDRcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgMTUwMDApOyAvLyAxNXMgbWF4IGZvciBpbWFnZVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlblJlc3BvbnNlID0gYXdhaXQgZmV0Y2goaW1hZ2VuVXJsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcclxuICAgICAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlczogW3sgcHJvbXB0OiBgQ2hpbGRyZW4gYm9vayBpbGx1c3RyYXRpb24sIHdhdGVyY29sb3Igc3R5bGUsIHNvZnQgY29sb3JzLCBoaWdoIHF1YWxpdHksIENocmlzdGlhbiB0aGVtZTogJHtkYXRhLnRpdGxlfWAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHsgc2FtcGxlQ291bnQ6IDEgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlbkRhdGEgPSBhd2FpdCBpbWFnZW5SZXNwb25zZS5qc29uKCkgYXMgYW55O1xyXG4gICAgICAgICAgICAgICAgaWYgKGltYWdlblJlc3BvbnNlLm9rICYmIGltYWdlbkRhdGEucHJlZGljdGlvbnM/LlswXT8uYnl0ZXNCYXNlNjRFbmNvZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJbWFnZSByZWNlaXZlZCwgb3B0aW1pemluZy4uLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuZnJvbShpbWFnZW5EYXRhLnByZWRpY3Rpb25zWzBdLmJ5dGVzQmFzZTY0RW5jb2RlZCwgJ2Jhc2U2NCcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgb3B0aW1pemVkQnVmZmVyID0gYXdhaXQgc2hhcnAoYnVmZmVyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVzaXplKDgwMCwgODAwLCB7IGZpdDogJ2luc2lkZScgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLndlYnAoeyBxdWFsaXR5OiA3MCB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAudG9CdWZmZXIoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGltaXplZEJ1ZmZlci5sZW5ndGggPiA4MCAqIDEwMjQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW1pemVkQnVmZmVyID0gYXdhaXQgc2hhcnAoYnVmZmVyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlc2l6ZSg2MDAsIDYwMCwgeyBmaXQ6ICdpbnNpZGUnIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAud2VicCh7IHF1YWxpdHk6IDYwIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9CdWZmZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gYHN0b3J5XyR7RGF0ZS5ub3coKX0ud2VicGA7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBlcnJvcjogdXBsb2FkRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLnN0b3JhZ2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmZyb20oJ3N0b3JpZXMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAudXBsb2FkKGZpbGVOYW1lLCBvcHRpbWl6ZWRCdWZmZXIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnaW1hZ2Uvd2VicCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZUNvbnRyb2w6ICczNjAwJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF1cGxvYWRFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGRhdGE6IHsgcHVibGljVXJsIH0gfSA9IHN1cGFiYXNlLnN0b3JhZ2UuZnJvbSgnc3RvcmllcycpLmdldFB1YmxpY1VybChmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdmVyX3VybCA9IHB1YmxpY1VybDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGltZ0Vycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkltYWdlIHNraXA6XCIsIGltZ0Vycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gZGVmYXVsdFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyA2LiBEQiBJbnNlcnRpb25cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDaGVja2luZyBmb3IgZHVwbGljYXRlIHRpdGxlLi4uXCIpO1xyXG4gICAgICAgICAgICBjb25zdCB7IGRhdGE6IGV4aXN0aW5nVGl0bGVDaGVjayB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgICAgICAgIC5mcm9tKCdzdG9yaWVzJylcclxuICAgICAgICAgICAgICAgIC5zZWxlY3QoJ2lkJylcclxuICAgICAgICAgICAgICAgIC5lcSgndGl0bGUnLCBkYXRhLnRpdGxlKVxyXG4gICAgICAgICAgICAgICAgLnNpbmdsZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGl0bGVDaGVjaykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUXHUwMEVEdHVsbyBEdXBsaWNhZG86IFwiJHtkYXRhLnRpdGxlfVwiLiBBIElBIHJlcGV0aXUgdW0gdFx1MDBFRHR1bG8gcXVlIGpcdTAwRTEgZXhpc3RlLiBUZW50ZSBub3ZhbWVudGUuYCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU2F2aW5nIHRvIFN1cGFiYXNlLi4uXCIpO1xyXG5cclxuICAgICAgICAgICAgLy8gTWFwIGNhdGVnb3J5IHRvIERCIGNvbnN0cmFpbnRcclxuICAgICAgICAgICAgbGV0IGZpbmFsQ2F0ZWdvcnkgPSAnYmlibGljYWwnO1xyXG4gICAgICAgICAgICBjb25zdCByZWNlaXZlZENhdCA9IFN0cmluZyhkYXRhLmNhdGVnb3J5KS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICBpZiAocmVjZWl2ZWRDYXQuaW5jbHVkZXMoJ21vcmFsJykpIGZpbmFsQ2F0ZWdvcnkgPSAnbW9yYWwnO1xyXG4gICAgICAgICAgICBpZiAocmVjZWl2ZWRDYXQuaW5jbHVkZXMoJ2JpYmxpY2FsJykpIGZpbmFsQ2F0ZWdvcnkgPSAnYmlibGljYWwnO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgeyBkYXRhOiBzdG9yeSwgZXJyb3I6IHN0b3J5RXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oJ3N0b3JpZXMnKS5pbnNlcnQoe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IGRhdGEudGl0bGUsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBkYXRhLmNvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICBtb3JhbDogZGF0YS5tb3JhbCxcclxuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBmaW5hbENhdGVnb3J5LFxyXG4gICAgICAgICAgICAgICAgY292ZXJfdXJsOiBjb3Zlcl91cmwsXHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogJzUgbWluJyxcclxuICAgICAgICAgICAgICAgIGlzX3ByZW1pdW06IHRydWUsIC8vIFN0YW5kYXJkIGZvciBBcmNhXHJcbiAgICAgICAgICAgICAgICBhdWRpb191cmw6ICcnXHJcbiAgICAgICAgICAgIH0pLnNlbGVjdCgpLnNpbmdsZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0b3J5RXJyb3IpIHRocm93IHN0b3J5RXJyb3I7XHJcblxyXG4gICAgICAgICAgICAvLyA3LiBRdWl6IEluc2VydGlvblxyXG4gICAgICAgICAgICBpZiAoZGF0YS5xdWl6ICYmIEFycmF5LmlzQXJyYXkoZGF0YS5xdWl6KSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBxIG9mIGRhdGEucXVpeikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogcXVlc3Rpb24gfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oJ3F1aXpfcXVlc3Rpb25zJykuaW5zZXJ0KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudF9pZDogc3RvcnkuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBxLnF1ZXN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmRlcl9pbmRleDogMVxyXG4gICAgICAgICAgICAgICAgICAgIH0pLnNlbGVjdCgpLnNpbmdsZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAocXVlc3Rpb24gJiYgcS5vcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnNQYXlsb2FkID0gcS5vcHRpb25zLm1hcCgob3B0OiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVzdGlvbl9pZDogcXVlc3Rpb24uaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBvcHQudGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzX2NvcnJlY3Q6IG9wdC5pc19jb3JyZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc3VwYWJhc2UuZnJvbSgncXVpel9hbHRlcm5hdGl2ZXMnKS5pbnNlcnQob3B0aW9uc1BheWxvYWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGbG93IGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBkYXRhLnRpdGxlIH0pO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2xpc3RfbW9kZWxzJykge1xyXG4gICAgICAgICAgICBjb25zdCBsaXN0VXJsID0gYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHM/a2V5PSR7Z29vZ2xlS2V5fWA7XHJcbiAgICAgICAgICAgIGNvbnN0IGxpc3RSZXNwb25zZSA9IGF3YWl0IGZldGNoKGxpc3RVcmwpO1xyXG4gICAgICAgICAgICBjb25zdCBsaXN0RGF0YSA9IGF3YWl0IGxpc3RSZXNwb25zZS5qc29uKCkgYXMgYW55O1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlLCBtb2RlbHM6IGxpc3REYXRhLm1vZGVscyB8fCBbXSB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJIYW5kbGVyIEVycm9yOlwiLCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcclxuICAgIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEJyYWdhXFxcXERlc2t0b3BcXFxcQXJjYSBkYSBBbGVncmlhIC0gQXBsaWNhdGl2byBJbmZhbnRpbCBDcmlzdFx1MDBFM29cXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxCcmFnYVxcXFxEZXNrdG9wXFxcXEFyY2EgZGEgQWxlZ3JpYSAtIEFwbGljYXRpdm8gSW5mYW50aWwgQ3Jpc3RcdTAwRTNvXFxcXGFwaVxcXFxpbXBvcnQtZHJpdmUtcGRmcy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQnJhZ2EvRGVza3RvcC9BcmNhJTIwZGElMjBBbGVncmlhJTIwLSUyMEFwbGljYXRpdm8lMjBJbmZhbnRpbCUyMENyaXN0JUMzJUEzby9hcGkvaW1wb3J0LWRyaXZlLXBkZnMudHNcIjtcclxuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJztcclxuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XHJcblxyXG5jb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8ICcnO1xyXG5jb25zdCBzdXBhYmFzZUtleSA9IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkgfHwgJyc7XHJcbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUtleSk7XHJcblxyXG5pbnRlcmZhY2UgRHJpdmVGaWxlIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBjYXRlZ29yeT86IHN0cmluZztcclxufVxyXG5cclxuLy8gSGVscGVyOiBDcmVhdGUgSldUIGZvciBHb29nbGUgU2VydmljZSBBY2NvdW50XHJcbmZ1bmN0aW9uIGNyZWF0ZUpXVChzZXJ2aWNlQWNjb3VudDogYW55KTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG5vdyA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApO1xyXG5cclxuICAgIGNvbnN0IGhlYWRlciA9IHtcclxuICAgICAgICBhbGc6ICdSUzI1NicsXHJcbiAgICAgICAgdHlwOiAnSldUJ1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBwYXlsb2FkID0ge1xyXG4gICAgICAgIGlzczogc2VydmljZUFjY291bnQuY2xpZW50X2VtYWlsLFxyXG4gICAgICAgIHNjb3BlOiAnaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vYXV0aC9kcml2ZS5yZWFkb25seScsXHJcbiAgICAgICAgYXVkOiAnaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4nLFxyXG4gICAgICAgIGV4cDogbm93ICsgMzYwMCxcclxuICAgICAgICBpYXQ6IG5vd1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBlbmNvZGVkSGVhZGVyID0gQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkoaGVhZGVyKSkudG9TdHJpbmcoJ2Jhc2U2NHVybCcpO1xyXG4gICAgY29uc3QgZW5jb2RlZFBheWxvYWQgPSBCdWZmZXIuZnJvbShKU09OLnN0cmluZ2lmeShwYXlsb2FkKSkudG9TdHJpbmcoJ2Jhc2U2NHVybCcpO1xyXG5cclxuICAgIGNvbnN0IHNpZ25hdHVyZUlucHV0ID0gYCR7ZW5jb2RlZEhlYWRlcn0uJHtlbmNvZGVkUGF5bG9hZH1gO1xyXG5cclxuICAgIGNvbnN0IHNpZ24gPSBjcnlwdG8uY3JlYXRlU2lnbignUlNBLVNIQTI1NicpO1xyXG4gICAgc2lnbi51cGRhdGUoc2lnbmF0dXJlSW5wdXQpO1xyXG4gICAgc2lnbi5lbmQoKTtcclxuXHJcbiAgICBjb25zdCBzaWduYXR1cmUgPSBzaWduLnNpZ24oc2VydmljZUFjY291bnQucHJpdmF0ZV9rZXksICdiYXNlNjR1cmwnKTtcclxuXHJcbiAgICByZXR1cm4gYCR7c2lnbmF0dXJlSW5wdXR9LiR7c2lnbmF0dXJlfWA7XHJcbn1cclxuXHJcbi8vIEhlbHBlcjogRXhjaGFuZ2UgSldUIGZvciBhY2Nlc3MgdG9rZW5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0QWNjZXNzVG9rZW4oc2VydmljZUFjY291bnQ6IGFueSk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICBjb25zdCBqd3QgPSBjcmVhdGVKV1Qoc2VydmljZUFjY291bnQpO1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuJywge1xyXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBuZXcgVVJMU2VhcmNoUGFyYW1zKHtcclxuICAgICAgICAgICAgZ3JhbnRfdHlwZTogJ3VybjppZXRmOnBhcmFtczpvYXV0aDpncmFudC10eXBlOmp3dC1iZWFyZXInLFxyXG4gICAgICAgICAgICBhc3NlcnRpb246IGp3dFxyXG4gICAgICAgIH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgY29uc3QgZXJyb3IgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZ2V0IGFjY2VzcyB0b2tlbjogJHtlcnJvcn1gKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgcmV0dXJuIGRhdGEuYWNjZXNzX3Rva2VuO1xyXG59XHJcblxyXG4vLyBIZWxwZXI6IEV4dHJhY3QgZm9sZGVyIElEIGZyb20gVVJMXHJcbmZ1bmN0aW9uIGV4dHJhY3RGb2xkZXJJZCh1cmw6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgY29uc3QgbWF0Y2ggPSB1cmwubWF0Y2goL2ZvbGRlcnNcXC8oW2EtekEtWjAtOV8tXSspLyk7XHJcbiAgICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXSA6IG51bGw7XHJcbn1cclxuXHJcbi8vIEhlbHBlcjogTGlzdCBmaWxlcyBpbiBhIGZvbGRlciB1c2luZyBhdXRoZW50aWNhdGVkIEFQSSBjYWxsXHJcbmFzeW5jIGZ1bmN0aW9uIGxpc3RGaWxlc0luRm9sZGVyKGZvbGRlcklkOiBzdHJpbmcsIGFjY2Vzc1Rva2VuOiBzdHJpbmcpOiBQcm9taXNlPHsgZmlsZXM6IERyaXZlRmlsZVtdLCBzdWJmb2xkZXJzOiBBcnJheTx7IGlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZyB9PiB9PiB7XHJcbiAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vZHJpdmUvdjMvZmlsZXM/YCArIG5ldyBVUkxTZWFyY2hQYXJhbXMoe1xyXG4gICAgICAgIHE6IGAnJHtmb2xkZXJJZH0nIGluIHBhcmVudHMgYW5kIHRyYXNoZWQ9ZmFsc2VgLFxyXG4gICAgICAgIGZpZWxkczogJ2ZpbGVzKGlkLCBuYW1lLCBtaW1lVHlwZSknLFxyXG4gICAgICAgIHBhZ2VTaXplOiAnMTAwMCdcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHthY2Nlc3NUb2tlbn1gXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgIGNvbnN0IGVycm9yID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgR29vZ2xlIERyaXZlIEFQSSBlcnJvcjogJHtyZXNwb25zZS5zdGF0dXNUZXh0fSAtICR7ZXJyb3J9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuXHJcbiAgICBjb25zdCBmaWxlczogRHJpdmVGaWxlW10gPSBbXTtcclxuICAgIGNvbnN0IHN1YmZvbGRlcnM6IEFycmF5PHsgaWQ6IHN0cmluZywgbmFtZTogc3RyaW5nIH0+ID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGRhdGEuZmlsZXMgfHwgW10pIHtcclxuICAgICAgICBpZiAoZmlsZS5taW1lVHlwZSA9PT0gJ2FwcGxpY2F0aW9uL3ZuZC5nb29nbGUtYXBwcy5mb2xkZXInKSB7XHJcbiAgICAgICAgICAgIHN1YmZvbGRlcnMucHVzaCh7IGlkOiBmaWxlLmlkLCBuYW1lOiBmaWxlLm5hbWUgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChmaWxlLm1pbWVUeXBlID09PSAnYXBwbGljYXRpb24vcGRmJykge1xyXG4gICAgICAgICAgICBmaWxlcy5wdXNoKHsgaWQ6IGZpbGUuaWQsIG5hbWU6IGZpbGUubmFtZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHsgZmlsZXMsIHN1YmZvbGRlcnMgfTtcclxufVxyXG5cclxuLy8gUmVjdXJzaXZlOiBQcm9jZXNzIGZvbGRlciBhbmQgYWxsIHN1YmZvbGRlcnNcclxuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc0ZvbGRlcihmb2xkZXJJZDogc3RyaW5nLCBhY2Nlc3NUb2tlbjogc3RyaW5nLCBjYXRlZ29yeT86IHN0cmluZyk6IFByb21pc2U8RHJpdmVGaWxlW10+IHtcclxuICAgIGNvbnN0IHsgZmlsZXMsIHN1YmZvbGRlcnMgfSA9IGF3YWl0IGxpc3RGaWxlc0luRm9sZGVyKGZvbGRlcklkLCBhY2Nlc3NUb2tlbik7XHJcblxyXG4gICAgLy8gVGFnIGZpbGVzIHdpdGggY2F0ZWdvcnlcclxuICAgIGNvbnN0IHRhZ2dlZEZpbGVzID0gZmlsZXMubWFwKGYgPT4gKHsgLi4uZiwgY2F0ZWdvcnk6IGNhdGVnb3J5IHx8ICdHZXJhbCcgfSkpO1xyXG5cclxuICAgIC8vIFByb2Nlc3Mgc3ViZm9sZGVycyByZWN1cnNpdmVseVxyXG4gICAgY29uc3Qgc3ViZm9sZGVyRmlsZXM6IERyaXZlRmlsZVtdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IHN1YmZvbGRlciBvZiBzdWJmb2xkZXJzKSB7XHJcbiAgICAgICAgY29uc3QgbmVzdGVkRmlsZXMgPSBhd2FpdCBwcm9jZXNzRm9sZGVyKHN1YmZvbGRlci5pZCwgYWNjZXNzVG9rZW4sIHN1YmZvbGRlci5uYW1lKTtcclxuICAgICAgICBzdWJmb2xkZXJGaWxlcy5wdXNoKC4uLm5lc3RlZEZpbGVzKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gWy4uLnRhZ2dlZEZpbGVzLCAuLi5zdWJmb2xkZXJGaWxlc107XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxOiBhbnksIHJlczogYW55KSB7XHJcbiAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyAwLiBTZWN1cml0eSBDaGVjayAoU3VwYWJhc2UgQXV0aClcclxuICAgIGNvbnN0IGF1dGhIZWFkZXIgPSByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uO1xyXG4gICAgaWYgKCFhdXRoSGVhZGVyIHx8ICFhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1VuYXV0aG9yaXplZCAtIE1pc3NpbmcgVG9rZW4nIH0pO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnNwbGl0KCcgJylbMV07XHJcblxyXG4gICAgY29uc3QgeyBkYXRhOiB7IHVzZXIgfSwgZXJyb3I6IGF1dGhFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5nZXRVc2VyKHRva2VuKTtcclxuICAgIGlmIChhdXRoRXJyb3IgfHwgIXVzZXIpIHtcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdVbmF1dGhvcml6ZWQgLSBJbnZhbGlkIFRva2VuJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHsgZm9sZGVyVXJsIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICAgICAgaWYgKCFmb2xkZXJVcmwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnRm9sZGVyIFVSTCBpcyByZXF1aXJlZCcgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHZXQgc2VydmljZSBhY2NvdW50IGNyZWRlbnRpYWxzXHJcbiAgICAgICAgY29uc3QgY3JlZGVudGlhbHMgPSBwcm9jZXNzLmVudi5HT09HTEVfU0VSVklDRV9BQ0NPVU5UX0NSRURFTlRJQUxTO1xyXG4gICAgICAgIGlmICghY3JlZGVudGlhbHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICdHT09HTEVfU0VSVklDRV9BQ0NPVU5UX0NSRURFTlRJQUxTIG5vdCBjb25maWd1cmVkIGluIGVudmlyb25tZW50IHZhcmlhYmxlcydcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzZXJ2aWNlQWNjb3VudCA9IEpTT04ucGFyc2UoY3JlZGVudGlhbHMpO1xyXG5cclxuICAgICAgICBjb25zdCBmb2xkZXJJZCA9IGV4dHJhY3RGb2xkZXJJZChmb2xkZXJVcmwpO1xyXG4gICAgICAgIGlmICghZm9sZGVySWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICdJbnZhbGlkIEdvb2dsZSBEcml2ZSBmb2xkZXIgVVJMLiBFeHBlY3RlZCBmb3JtYXQ6IGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9kcml2ZS9mb2xkZXJzL1tGT0xERVJfSURdJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBTdGFydGluZyByZWN1cnNpdmUgaW1wb3J0IGZvciBmb2xkZXI6ICR7Zm9sZGVySWR9YCk7XHJcblxyXG4gICAgICAgIC8vIEdldCBhY2Nlc3MgdG9rZW5cclxuICAgICAgICBjb25zdCBhY2Nlc3NUb2tlbiA9IGF3YWl0IGdldEFjY2Vzc1Rva2VuKHNlcnZpY2VBY2NvdW50KTtcclxuXHJcbiAgICAgICAgLy8gUHJvY2VzcyBmb2xkZXIgcmVjdXJzaXZlbHlcclxuICAgICAgICBjb25zdCBhbGxGaWxlcyA9IGF3YWl0IHByb2Nlc3NGb2xkZXIoZm9sZGVySWQsIGFjY2Vzc1Rva2VuKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coYEZvdW5kICR7YWxsRmlsZXMubGVuZ3RofSBQREYgZmlsZXMgYWNyb3NzIGFsbCBmb2xkZXJzYCk7XHJcblxyXG4gICAgICAgIC8vIERCIEluc2VydGlvbiB3aXRoIGRldGFpbGVkIGxvZ2dpbmdcclxuICAgICAgICBsZXQgaW1wb3J0ZWRDb3VudCA9IDA7XHJcbiAgICAgICAgbGV0IHNraXBwZWRDb3VudCA9IDA7XHJcbiAgICAgICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhgU3RhcnRpbmcgREIgaW5zZXJ0aW9uIGZvciAke2FsbEZpbGVzLmxlbmd0aH0gZmlsZXMuLi5gKTtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGFsbEZpbGVzKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBleGlzdHNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogZXhpc3RpbmcsIGVycm9yOiBjaGVja0Vycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tKCdhY3Rpdml0aWVzJylcclxuICAgICAgICAgICAgICAgICAgICAuc2VsZWN0KCdpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgLmVxKCdmaWxlX2lkJywgZmlsZS5pZClcclxuICAgICAgICAgICAgICAgICAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hlY2tFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYENoZWNrIGVycm9yIGZvciAke2ZpbGUubmFtZX06YCwgY2hlY2tFcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goYENoZWNrIGZhaWxlZDogJHtmaWxlLm5hbWV9IC0gJHtjaGVja0Vycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFNraXBwaW5nIGV4aXN0aW5nIGZpbGU6ICR7ZmlsZS5uYW1lfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIHNraXBwZWRDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGRvd25sb2FkVXJsID0gYGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS91Yz9leHBvcnQ9ZG93bmxvYWQmaWQ9JHtmaWxlLmlkfWA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aXRsZSA9IGZpbGUubmFtZS5yZXBsYWNlKCcucGRmJywgJycpLnJlcGxhY2UoL1stX10vZywgJyAnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbnNlcnREYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcclxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYEltcG9ydGFkbyBkbyBHb29nbGUgRHJpdmUgLSAke2ZpbGUuY2F0ZWdvcnl9YCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY29sb3JpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBmaWxlLmNhdGVnb3J5IHx8ICdHZXJhbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZV9pZDogZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwZGZfdXJsOiBkb3dubG9hZFVybCxcclxuICAgICAgICAgICAgICAgICAgICBpbWFnZV91cmw6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgaXNfYWN0aXZlOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJbnNlcnRpbmc6ICR7ZmlsZS5uYW1lfWAsIGluc2VydERhdGEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogaW5zZXJ0ZWQsIGVycm9yOiBpbnNlcnRFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbSgnYWN0aXZpdGllcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmluc2VydChpbnNlcnREYXRhKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZWxlY3QoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaW5zZXJ0RXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBJbnNlcnQgZXJyb3IgZm9yICR7ZmlsZS5uYW1lfTpgLCBpbnNlcnRFcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goYEluc2VydCBmYWlsZWQ6ICR7ZmlsZS5uYW1lfSAtICR7aW5zZXJ0RXJyb3IubWVzc2FnZX1gKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFN1Y2Nlc3NmdWxseSBpbnNlcnRlZDogJHtmaWxlLm5hbWV9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0ZWRDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXhjZXB0aW9uIHByb2Nlc3NpbmcgJHtmaWxlLm5hbWV9OmAsIGVycik7XHJcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChgRXhjZXB0aW9uOiAke2ZpbGUubmFtZX0gLSAke2Vyci5tZXNzYWdlfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhgSW1wb3J0IGNvbXBsZXRlLiBJbXBvcnRlZDogJHtpbXBvcnRlZENvdW50fSwgU2tpcHBlZDogJHtza2lwcGVkQ291bnR9LCBFcnJvcnM6ICR7ZXJyb3JzLmxlbmd0aH1gKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgaW1wb3J0ZWQ6IGltcG9ydGVkQ291bnQsXHJcbiAgICAgICAgICAgIHRvdGFsRm91bmQ6IGFsbEZpbGVzLmxlbmd0aCxcclxuICAgICAgICAgICAgc2tpcHBlZDogc2tpcHBlZENvdW50LFxyXG4gICAgICAgICAgICBlcnJvcnM6IGVycm9ycy5sZW5ndGggPiAwID8gZXJyb3JzIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBgXHUyNzA1IEltcG9ydGFcdTAwRTdcdTAwRTNvIGNvbmNsdVx1MDBFRGRhISBFbmNvbnRyYWRvczogJHthbGxGaWxlcy5sZW5ndGh9IFBERnMuIE5vdm9zOiAke2ltcG9ydGVkQ291bnR9LiBKXHUwMEUxIGV4aXN0ZW50ZXM6ICR7c2tpcHBlZENvdW50fS4ke2Vycm9ycy5sZW5ndGggPiAwID8gYCBFcnJvczogJHtlcnJvcnMubGVuZ3RofWAgOiAnJ31gXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NSSVRJQ0FMIEhBTkRMRVIgRVJST1I6JywgZXJyb3IpO1xyXG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAnVW5rbm93biBzZXJ2ZXIgZXJyb3InLFxyXG4gICAgICAgICAgICBoaW50OiBlcnJvci5tZXNzYWdlPy5pbmNsdWRlcygnR09PR0xFX1NFUlZJQ0VfQUNDT1VOVCcpID9cclxuICAgICAgICAgICAgICAgICdDb25maWd1cmUgR09PR0xFX1NFUlZJQ0VfQUNDT1VOVF9DUkVERU5USUFMUyBuYSBWZXJjZWwgY29tIG8gSlNPTiBkYSBTZXJ2aWNlIEFjY291bnQnIDpcclxuICAgICAgICAgICAgICAgIGVycm9yLm1lc3NhZ2U/LmluY2x1ZGVzKCdhY2Nlc3MgdG9rZW4nKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgJ1ZlcmlmaXF1ZSBzZSBhcyBjcmVkZW5jaWFpcyBkYSBTZXJ2aWNlIEFjY291bnQgZXN0XHUwMEUzbyBjb3JyZXRhcycgOlxyXG4gICAgICAgICAgICAgICAgICAgICdWZXJpZmlxdWUgc2UgYSBTZXJ2aWNlIEFjY291bnQgdGVtIHBlcm1pc3NcdTAwRTNvIGRlIGxlaXR1cmEgbmEgcGFzdGEgZG8gRHJpdmUgKGNvbXBhcnRpbGhlIGEgcGFzdGEgY29tIG8gZW1haWwgZGEgU2VydmljZSBBY2NvdW50KSdcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEJyYWdhXFxcXERlc2t0b3BcXFxcQXJjYSBkYSBBbGVncmlhIC0gQXBsaWNhdGl2byBJbmZhbnRpbCBDcmlzdFx1MDBFM29cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEJyYWdhXFxcXERlc2t0b3BcXFxcQXJjYSBkYSBBbGVncmlhIC0gQXBsaWNhdGl2byBJbmZhbnRpbCBDcmlzdFx1MDBFM29cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0JyYWdhL0Rlc2t0b3AvQXJjYSUyMGRhJTIwQWxlZ3JpYSUyMC0lMjBBcGxpY2F0aXZvJTIwSW5mYW50aWwlMjBDcmlzdCVDMyVBM28vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgLy8gTG9hZCBlbnYgZmlsZSBiYXNlZCBvbiBgbW9kZWAgaW4gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuXG4gIC8vIFNldCB0aGUgdGhpcmQgcGFyYW1ldGVyIHRvICcnIHRvIGxvYWQgYWxsIGVudiByZWdhcmRsZXNzIG9mIHRoZSBgVklURV9gIHByZWZpeC5cbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHN0cmF0ZWdpZXM6ICdpbmplY3RNYW5pZmVzdCcsXG4gICAgICAgIHNyY0RpcjogJ3NyYycsXG4gICAgICAgIGZpbGVuYW1lOiAnc3cudHMnLFxuICAgICAgICAvLyBObyByZWdpc3RlclR5cGUgPSBWaXRlUFdBIHdvbid0IGdlbmVyYXRlIG9yIGluamVjdCByZWdpc3RlclNXLmpzXG4gICAgICAgIC8vIFNXIHJlZ2lzdHJhdGlvbiBpcyBoYW5kbGVkIG1hbnVhbGx5IGluIG1haW4udHN4IHZpYSByZXF1ZXN0SWRsZUNhbGxiYWNrXG4gICAgICAgIGRldk9wdGlvbnM6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHR5cGU6ICdtb2R1bGUnXG4gICAgICAgIH0sXG4gICAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgICAgbmFtZTogJ0FyY2EgZGEgQWxlZ3JpYScsXG4gICAgICAgICAgc2hvcnRfbmFtZTogJ0FyY2EnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXBsaWNhdGl2byBJbmZhbnRpbCBDcmlzdFx1MDBFM28nLFxuICAgICAgICAgIHRoZW1lX2NvbG9yOiAnIzBmMTcyYScsXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwZjE3MmEnLFxuICAgICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgICBpY29uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6ICdodHRwczovL2d5cHpyenNteGdqdGtpZHpuc3RkLnN1cGFiYXNlLmNvL3N0b3JhZ2UvdjEvb2JqZWN0L3B1YmxpYy9hY3Rpdml0aWVzL21ldWFtaWd1aXRvcHdhaWNvbmUud2VicCcsXG4gICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS93ZWJwJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9neXB6cnpzbXhnanRraWR6bnN0ZC5zdXBhYmFzZS5jby9zdG9yYWdlL3YxL29iamVjdC9wdWJsaWMvYWN0aXZpdGllcy9tZXVhbWlndWl0b3B3YWljb25lLndlYnAnLFxuICAgICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2Uvd2VicCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd2VicH0nXVxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIC8vIERlZmluaXRpdmUgZml4OiBtYXJrIHJlZ2lzdGVyU1cuanMgYXMgYXN5bmMgQU5EIG1ha2UgbWFpbiBDU1Mgbm9uLWJsb2NraW5nIHZpYSB3cml0ZUJ1bmRsZVxuICAgICAgLy8gKGNhdGNoZXMgVml0ZVBXQSdzIGxhdGUtc3RhZ2UgaW5qZWN0aW9uIHRoYXQgYnlwYXNzZXMgdHJhbnNmb3JtSW5kZXhIdG1sKVxuICAgICAge1xuICAgICAgICBuYW1lOiAnYXN5bmMtcmVnaXN0ZXItc3cnLFxuICAgICAgICBlbmZvcmNlOiAncG9zdCcsXG4gICAgICAgIGFwcGx5OiAnYnVpbGQnLFxuICAgICAgICB0cmFuc2Zvcm1JbmRleEh0bWw6IHtcbiAgICAgICAgICBvcmRlcjogJ3Bvc3QnLFxuICAgICAgICAgIGhhbmRsZXIoaHRtbDogc3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gaHRtbC5yZXBsYWNlKFxuICAgICAgICAgICAgICAvKDxzY3JpcHRcXGJbXj5dKlxcYnNyYz1cIlteXCJdKnJlZ2lzdGVyU1dcXC5qc1wiW14+XSopPi9naSxcbiAgICAgICAgICAgICAgJyQxIGFzeW5jPidcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBhc3luYyB3cml0ZUJ1bmRsZSh0aGlzOiBhbnksIG9wdGlvbnM6IGFueSkge1xuICAgICAgICAgIGNvbnN0IGZzID0gYXdhaXQgaW1wb3J0KCdmcycpO1xuICAgICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBpbXBvcnQoJ3BhdGgnKTtcbiAgICAgICAgICBjb25zdCBvdXREaXIgPSBvcHRpb25zLmRpciB8fCAnZGlzdCc7XG4gICAgICAgICAgY29uc3QgaHRtbEZpbGUgPSBwYXRoLmpvaW4ob3V0RGlyLCAnaW5kZXguaHRtbCcpO1xuICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGh0bWxGaWxlKSkge1xuICAgICAgICAgICAgbGV0IGh0bWwgPSBmcy5yZWFkRmlsZVN5bmMoaHRtbEZpbGUsICd1dGYtOCcpO1xuXG4gICAgICAgICAgICAvLyAxLiBNYWtlIHJlZ2lzdGVyU1cuanMgYXN5bmNcbiAgICAgICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoXG4gICAgICAgICAgICAgIC8oPHNjcmlwdFxcYltePl0qXFxic3JjPVwiW15cIl0qcmVnaXN0ZXJTV1xcLmpzXCJbXj5dKik+L2dpLFxuICAgICAgICAgICAgICAnJDEgYXN5bmM+J1xuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8gMi4gQ29udmVydCBtYWluIENTUyBmcm9tIHJlbmRlci1ibG9ja2luZyB0byBhc3luYyAobWVkaWE9cHJpbnQgdHJpY2spXG4gICAgICAgICAgICAvLyBTYWZlIGluIFJlYWN0IFNQQTogQ1NTICgzNzBtcykgYWx3YXlzIGZpbmlzaGVzIGJlZm9yZSBKUyAoODg5bXMpXG4gICAgICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKFxuICAgICAgICAgICAgICAvPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIGNyb3Nzb3JpZ2luIGhyZWY9XCIoXFwvYXNzZXRzXFwvaW5kZXgtW15cIl0rXFwuY3NzKVwiPi9nLFxuICAgICAgICAgICAgICAnPGxpbmsgcmVsPVwicHJlbG9hZFwiIGFzPVwic3R5bGVcIiBvbmxvYWQ9XCJ0aGlzLm9ubG9hZD1udWxsO3RoaXMucmVsPVxcJ3N0eWxlc2hlZXRcXCdcIiBocmVmPVwiJDFcIj48bm9zY3JpcHQ+PGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIGhyZWY9XCIkMVwiPjwvbm9zY3JpcHQ+J1xuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhodG1sRmlsZSwgaHRtbCwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW2FzeW5jLXJlZ2lzdGVyLXN3XSBQYXRjaGVkIGRpc3QvaW5kZXguaHRtbDogcmVnaXN0ZXJTVyBhc3luYyArIENTUyBub24tYmxvY2tpbmcnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdjb25maWd1cmUtc2VydmVyJyxcbiAgICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvYWdlbnQvZmxvdycsIGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNTtcbiAgICAgICAgICAgICAgcmVzLmVuZCgnTWV0aG9kIE5vdCBBbGxvd2VkJyk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2h1bmtzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXEpIHtcbiAgICAgICAgICAgICAgY2h1bmtzLnB1c2goY2h1bmspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYm9keVRleHQgPSBCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgLy8gSW5qZWN0IEVudiBWYXJzIGludG8gcHJvY2Vzcy5lbnYgZm9yIHRoZSBoYW5kbGVyIHRvIHNlZVxuICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHByb2Nlc3MuZW52LCBlbnYpO1xuXG4gICAgICAgICAgICAgIC8vIER5bmFtaWMgaW1wb3J0XG4gICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogaGFuZGxlciB9ID0gYXdhaXQgaW1wb3J0KCcuL2FwaS9hZ2VudC9mbG93LnRzJyk7XG5cbiAgICAgICAgICAgICAgLy8gTW9jayBSZXF1ZXN0XG4gICAgICAgICAgICAgIGNvbnN0IHdlYlJlcSA9IG5ldyBSZXF1ZXN0KCdodHRwOi8vbG9jYWxob3N0OjgwODAvYXBpL2FnZW50L2Zsb3cnLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMgYXMgYW55LFxuICAgICAgICAgICAgICAgIGJvZHk6IGJvZHlUZXh0XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIC8vIFRoZSBoYW5kbGVyIGluIGZsb3cudHMgZXhwZWN0cyAocmVxLCByZXMpIE5vZGUgc3R5bGVcbiAgICAgICAgICAgICAgLy8gQnV0IHdlIGNhbiBBTFNPIHRyeSB0byBjYWxsIGl0IHN0YW5kYXJkIHN0eWxlIGlmIGl0IHJldHVybnMgYSBSZXNwb25zZVxuICAgICAgICAgICAgICAvLyBUbyBmaXggdGhlIFwiRXhwZWN0ZWQgMiBhcmd1bWVudHNcIiBlcnJvciwgd2UgcHJvdmlkZSBhbiBlbXB0eSBtb2NrIGZvciByZXMgaWYgbmVlZGVkXG4gICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXJGbiA9IGhhbmRsZXIgYXMgYW55O1xuICAgICAgICAgICAgICBjb25zdCB3ZWJSZXMgPSBhd2FpdCAoaGFuZGxlckZuLmxlbmd0aCA+IDEgPyBoYW5kbGVyRm4od2ViUmVxLCByZXMpIDogaGFuZGxlckZuKHdlYlJlcSkpO1xuXG4gICAgICAgICAgICAgIC8vIElmIGhhbmRsZXIgYWxyZWFkeSBoYW5kbGVkIHRoZSByZXNwb25zZSAoTm9kZSBzdHlsZSksIHdlYlJlcyBtaWdodCBiZSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgaWYgKCF3ZWJSZXMpIHJldHVybjtcblxuICAgICAgICAgICAgICAvLyBNb2NrIFJlc3BvbnNlIChGZXRjaCBTdHlsZSlcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSB3ZWJSZXMuc3RhdHVzO1xuICAgICAgICAgICAgICAod2ViUmVzLmhlYWRlcnMgYXMgSGVhZGVycykuZm9yRWFjaCgodmFsOiBzdHJpbmcsIGtleTogc3RyaW5nKSA9PiByZXMuc2V0SGVhZGVyKGtleSwgdmFsKSk7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlVGV4dCA9IGF3YWl0IHdlYlJlcy50ZXh0KCk7XG4gICAgICAgICAgICAgIHJlcy5lbmQocmVzcG9uc2VUZXh0KTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSSBQcm94eSBFcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyPy5tZXNzYWdlIHx8IFwiVW5rbm93biBFcnJvclwiIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvaW1wb3J0LWRyaXZlLXBkZnMnLCBhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDU7XG4gICAgICAgICAgICAgIHJlcy5lbmQoJ01ldGhvZCBOb3QgQWxsb3dlZCcpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNodW5rczogYW55W10gPSBbXTtcbiAgICAgICAgICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgcmVxKSB7XG4gICAgICAgICAgICAgIGNodW5rcy5wdXNoKGNodW5rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGJvZHlUZXh0ID0gQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIC8vIEluamVjdCBFbnYgVmFycyBpbnRvIHByb2Nlc3MuZW52IGZvciB0aGUgaGFuZGxlciB0byBzZWVcbiAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihwcm9jZXNzLmVudiwgZW52KTtcblxuICAgICAgICAgICAgICAvLyBEeW5hbWljIGltcG9ydFxuICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IGhhbmRsZXIgfSA9IGF3YWl0IGltcG9ydCgnLi9hcGkvaW1wb3J0LWRyaXZlLXBkZnMudHMnKTtcblxuICAgICAgICAgICAgICAvLyBNb2NrIFJlcXVlc3RcbiAgICAgICAgICAgICAgY29uc3Qgd2ViUmVxID0gbmV3IFJlcXVlc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9hcGkvaW1wb3J0LWRyaXZlLXBkZnMnLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMgYXMgYW55LFxuICAgICAgICAgICAgICAgIGJvZHk6IGJvZHlUZXh0XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXJGbiA9IGhhbmRsZXIgYXMgYW55O1xuICAgICAgICAgICAgICBjb25zdCB3ZWJSZXMgPSBhd2FpdCAoaGFuZGxlckZuLmxlbmd0aCA+IDEgPyBoYW5kbGVyRm4od2ViUmVxLCByZXMpIDogaGFuZGxlckZuKHdlYlJlcSkpO1xuXG4gICAgICAgICAgICAgIGlmICghd2ViUmVzKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSB3ZWJSZXMuc3RhdHVzO1xuICAgICAgICAgICAgICAod2ViUmVzLmhlYWRlcnMgYXMgSGVhZGVycykuZm9yRWFjaCgodmFsOiBzdHJpbmcsIGtleTogc3RyaW5nKSA9PiByZXMuc2V0SGVhZGVyKGtleSwgdmFsKSk7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlVGV4dCA9IGF3YWl0IHdlYlJlcy50ZXh0KCk7XG4gICAgICAgICAgICAgIHJlcy5lbmQocmVzcG9uc2VUZXh0KTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSSBQcm94eSBFcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyPy5tZXNzYWdlIHx8IFwiVW5rbm93biBFcnJvclwiIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgIC8vIEdyb3VwIGhlYXZ5IGxpYnJhcmllcyB0byBrZWVwIGVudHJ5IHBvaW50IHNtYWxsXG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykgfHwgaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdAcmFkaXgtdWknKSB8fCBpZC5pbmNsdWRlcygnQHRhbnN0YWNrJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1saWJzJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0EsU0FBUyxvQkFBb0I7QUFFN0IsT0FBTyxXQUFXO0FBc0JsQixlQUFPLFFBQStCLEtBQVUsS0FBVTtBQUN0RCxNQUFJLElBQUksV0FBVyxRQUFRO0FBQ3ZCLFdBQU8sSUFBSSxPQUFPLEdBQUcsRUFBRSxLQUFLLEVBQUUsT0FBTyxxQkFBcUIsQ0FBQztBQUFBLEVBQy9EO0FBRUEsTUFBSTtBQUNBLFlBQVEs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QUFFYixrQkFBSSxhQUFhLE9BQU87QUFDeEIsY0FBQyxPQUFPLFFBQW9CLFFBQVEsQ0FBQyxLQUFhLFFBQWdCLElBQUksVUFBVSxLQUFLLEdBQUcsQ0FBQztBQUN6RixvQkFBTSxlQUFlLE1BQU0sT0FBTyxLQUFLO0FBQ3ZDLGtCQUFJLElBQUksWUFBWTtBQUFBLFlBRXRCLFNBQVMsS0FBVTtBQUNqQixzQkFBUSxNQUFNLG9CQUFvQixHQUFHO0FBQ3JDLGtCQUFJLGFBQWE7QUFDakIsa0JBQUksSUFBSSxLQUFLLFVBQVUsRUFBRSxPQUFPLEtBQUssV0FBVyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQUEsWUFDcEU7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGFBQWEsSUFBSTtBQUNmLGdCQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFFL0Isa0JBQUksR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsY0FBYyxLQUFLLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLFdBQVcsR0FBRztBQUNuSCx1QkFBTztBQUFBLGNBQ1Q7QUFDQSxxQkFBTztBQUFBLFlBQ1Q7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbImNvbmZpZyIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJzdXBhYmFzZSIsICJwYXRoIiwgImhhbmRsZXIiXQp9Cg==
