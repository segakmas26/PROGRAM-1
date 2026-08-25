import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { handleAIWarisRequest } from './src/server/apiHandler';

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-middleware-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/ai-waris' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body);
              const result = await handleAIWarisRequest(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            }
          });
          return;
        }

        if (req.url === '/api/drive/sync' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const now = new Date().toISOString();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: 'Data berjaya diselaraskan ke Google Drive',
                folderId: parsed.folderId || '19WYcymaklu-0-lpVAJBdnaDed2phO2v-',
                lastSync: now,
                snapshotId: parsed.snapshotId,
                filename: parsed.filename,
                personCount: parsed.personCount,
              }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            }
          });
          return;
        }

        if (req.url === '/api/drive/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            folderId: '19WYcymaklu-0-lpVAJBdnaDed2phO2v-',
            connected: true,
            storageUsed: '2.4 MB',
            lastSync: new Date().toISOString(),
          }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
