
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
              const webRes = await (handler.length > 1 ? handler(webReq, res) : handler(webReq));

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
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
