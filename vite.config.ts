import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        // No registerType = VitePWA won't generate or inject registerSW.js
        // SW registration is handled manually in main.tsx via requestIdleCallback
        devOptions: {
          enabled: true,
          type: 'module'
        },
        manifest: {
          name: 'Arca da Alegria',
          short_name: 'Arca',
          description: 'Aplicativo Infantil Cristão',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp',
              sizes: '192x192',
              type: 'image/webp'
            },
            {
              src: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp',
              sizes: '512x512',
              type: 'image/webp'
            }
          ]
        },
        injectManifest: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg}'],
          cleanupOutdatedCaches: true,
        }
      }),
      // Definitive fix: mark registerSW.js as async AND make main CSS non-blocking via writeBundle
      // (catches VitePWA's late-stage injection that bypasses transformIndexHtml)
      {
        name: 'async-register-sw',
        enforce: 'post',
        apply: 'build',
        transformIndexHtml: {
          order: 'post',
          handler(html: string) {
            return html.replace(
              /(<script\b[^>]*\bsrc="[^"]*registerSW\.js"[^>]*)>/gi,
              '$1 async>'
            );
          }
        },
        async writeBundle(this: any, options: any) {
          const fs = await import('fs');
          const path = await import('path');
          const outDir = options.dir || 'dist';
          const htmlFile = path.join(outDir, 'index.html');
          if (fs.existsSync(htmlFile)) {
            let html = fs.readFileSync(htmlFile, 'utf-8');

            // 1. Make registerSW.js async
            html = html.replace(
              /(<script\b[^>]*\bsrc="[^"]*registerSW\.js"[^>]*)>/gi,
              '$1 async>'
            );

            // 2. Convert main CSS from render-blocking to async (media=print trick)
            // Safe in React SPA: CSS (370ms) always finishes before JS (889ms)
            html = html.replace(
              /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/g,
              '<link rel="preload" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" href="$1"><noscript><link rel="stylesheet" href="$1"></noscript>'
            );

            fs.writeFileSync(htmlFile, html, 'utf-8');
            console.log('[async-register-sw] Patched dist/index.html: registerSW async + CSS non-blocking');
          }
        }
      },
      {
        name: 'configure-server',
        configureServer(server) {
          server.middlewares.use('/api/agent/flow', async (req, res, next) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            const chunks: any[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const bodyText = Buffer.concat(chunks).toString();

            try {
              // Inject Env Vars into process.env for the handler to see
              Object.assign(process.env, env);

              // Dynamic import
              const { default: handler } = await import('./api/agent/flow.ts');

              // Mock Request
              const webReq = new Request('http://localhost:8080/api/agent/flow', {
                method: 'POST',
                headers: req.headers as any,
                body: bodyText
              });

              // The handler in flow.ts expects (req, res) Node style
              // But we can ALSO try to call it standard style if it returns a Response
              // To fix the "Expected 2 arguments" error, we provide an empty mock for res if needed
              const handlerFn = handler as any;
              const webRes = await (handlerFn.length > 1 ? handlerFn(webReq, res) : handlerFn(webReq));

              // If handler already handled the response (Node style), webRes might be undefined
              if (!webRes) return;

              // Mock Response (Fetch Style)
              res.statusCode = webRes.status;
              (webRes.headers as Headers).forEach((val: string, key: string) => res.setHeader(key, val));
              const responseText = await webRes.text();
              res.end(responseText);

            } catch (err: any) {
              console.error("API Proxy Error:", err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || "Unknown Error" }));
            }
          });

          server.middlewares.use('/api/import-drive-pdfs', async (req, res, next) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            const chunks: any[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const bodyText = Buffer.concat(chunks).toString();

            try {
              // Inject Env Vars into process.env for the handler to see
              Object.assign(process.env, env);

              // Dynamic import
              const { default: handler } = await import('./api/import-drive-pdfs.ts');

              // Mock Request
              const webReq = new Request('http://localhost:8080/api/import-drive-pdfs', {
                method: 'POST',
                headers: req.headers as any,
                body: bodyText
              });

              const handlerFn = handler as any;
              const webRes = await (handlerFn.length > 1 ? handlerFn(webReq, res) : handlerFn(webReq));

              if (!webRes) return;

              res.statusCode = webRes.status;
              (webRes.headers as Headers).forEach((val: string, key: string) => res.setHeader(key, val));
              const responseText = await webRes.text();
              res.end(responseText);

            } catch (err: any) {
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
            // Only split what we know is safe and heavy
            // @supabase is ~250KB and never shares React context — safe to isolate
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
            // Admin pages are large and only used by admins — safe to isolate
            if (id.includes('src/pages/admin')) {
              return 'chunk-admin';
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
