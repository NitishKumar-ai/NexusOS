// packages/connectors/server.ts
// HTTP server that Rust Traffic Controller calls to execute connector actions
// Runs on port 3002

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { getConnector } from './index';

const PORT = process.env.CONNECTOR_PORT ? parseInt(process.env.CONNECTOR_PORT) : 3002;

// Load connector configs from environment
async function initConnectors() {
  const firebase = getConnector('firebase');
  await firebase.connect({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });

  const github = getConnector('github');
  await github.connect({ apiKey: process.env.GITHUB_TOKEN });

  const linear = getConnector('linear');
  await linear.connect({ apiKey: process.env.LINEAR_API_KEY });

  const figma = getConnector('figma');
  await figma.connect({ apiKey: process.env.FIGMA_TOKEN });

  console.log('[Connectors] All connectors initialized');
}

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Content-Type', 'application/json');

  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', port: PORT }));
    return;
  }

  // POST /connector/:name/:action
  const match = req.url?.match(/^\/connector\/([^/]+)\/([^/]+)$/);
  if (!match || req.method !== 'POST') {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found. Use POST /connector/:name/:action' }));
    return;
  }

  const [, connectorName, action] = match;

  try {
    const params = await parseBody(req);
    const connector = getConnector(connectorName);
    const result = await connector.execute(action, params);
    res.writeHead(result.success ? 200 : 400);
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : 'Connector error',
    }));
  }
});

initConnectors().then(() => {
  server.listen(PORT, () => {
    console.log(`[Connectors] Server running on http://localhost:${PORT}`);
    console.log(`[Connectors] Available: firebase, github, linear, figma`);
  });
}).catch(err => {
  console.error('[Connectors] Init failed:', err);
  process.exit(1);
});
