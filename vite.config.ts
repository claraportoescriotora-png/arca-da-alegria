import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
      // Added hmr overlay configuration for better dev experience in 2026
      hmr: {
        overlay: true,
      }
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate', // Modern VitePWA default
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
              type: 'image/webp',
              purpose: 'any maskable'
            },
            {
              src: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp',
              sizes: '512x512',
              type: 'image/webp',
              purpose: 'any maskable'
            }
          ]
        },
        injectManifest: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // Increased for 2026 asset sizes
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg}'],
          cleanupOutdatedCaches: true,
        }
      }),
      // Definitive fix: mark registerSW.js as async AND make main CSS non-blocking
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
          const handleApiRequest = async (req: any, res: any, endpoint: string) => {
            const chunks: any[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const bodyText = Buffer.concat(chunks).toString();

            try {
              Object.assign(process.env, env);
              const handlerPath = `./api/${endpoint}.ts`;
              
              if (!fs.existsSync(path.resolve(__dirname, handlerPath))) {
                res.statusCode = 404;
                res.end(`API Handler for ${endpoint} not found`);
                return;
              }

              const { default: handler } = await import(handlerPath);
              const webReq = new Request(`http://localhost:8080/api/${endpoint}`, {
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
              console.error(`API Proxy Error [${endpoint}]:`, err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || "Unknown Error" }));
            }
          };

          server.middlewares.use('/api/agent/flow', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }
            handleApiRequest(req, res, 'agent/flow');
          });

          server.middlewares.use('/api/import-drive-pdfs', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }
            handleApiRequest(req, res, 'import-drive-pdfs');
          });
        }
      }
    ],
    build: {
      target: 'esnext', // Support 2026 modern JS features
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
            if (id.includes('node_modules/react')) return 'vendor-react';
            if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
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
