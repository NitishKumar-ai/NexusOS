// packages/connectors/server.ts
// HTTP server that Rust Traffic Controller calls to execute connector actions
// Runs on port 3002

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { getConnector, listConnectors } from './index';

const PORT = process.env.CONNECTOR_PORT ? parseInt(process.env.CONNECTOR_PORT) : 3002;

// Load connector configs from environment
async function initConnectors() {
  // Tier 1 — already working
  await getConnector('firebase').connect({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });

  await getConnector('github').connect({ apiKey: process.env.GITHUB_TOKEN });
  await getConnector('linear').connect({ apiKey: process.env.LINEAR_API_KEY });
  await getConnector('figma').connect({ apiKey: process.env.FIGMA_TOKEN });

  // Tier 2 — new
  if (process.env.SLACK_BOT_TOKEN)
    await getConnector('slack').connect({ apiKey: process.env.SLACK_BOT_TOKEN });
  if (process.env.NOTION_TOKEN)
    await getConnector('notion').connect({ apiKey: process.env.NOTION_TOKEN });
  if (process.env.JIRA_TOKEN)
    await getConnector('jira').connect({ apiKey: process.env.JIRA_TOKEN, email: process.env.JIRA_EMAIL, domain: process.env.JIRA_DOMAIN });
  if (process.env.GOOGLE_ACCESS_TOKEN)
    await getConnector('google-calendar').connect({ apiKey: process.env.GOOGLE_ACCESS_TOKEN });
  if (process.env.GOOGLE_ACCESS_TOKEN)
    await getConnector('gmail').connect({ apiKey: process.env.GOOGLE_ACCESS_TOKEN });

  // Tier 3
  if (process.env.VERCEL_TOKEN)
    await getConnector('vercel').connect({ apiKey: process.env.VERCEL_TOKEN });
  if (process.env.SUPABASE_URL)
    await getConnector('supabase').connect({ baseUrl: process.env.SUPABASE_URL, apiKey: process.env.SUPABASE_KEY });

  // Tier 4
  if (process.env.SENTRY_TOKEN)
    await getConnector('sentry').connect({ apiKey: process.env.SENTRY_TOKEN, orgSlug: process.env.SENTRY_ORG });

  // Tier 5
  if (process.env.STRIPE_SECRET_KEY)
    await getConnector('stripe').connect({ apiKey: process.env.STRIPE_SECRET_KEY });
  if (process.env.RESEND_API_KEY)
    await getConnector('resend').connect({ apiKey: process.env.RESEND_API_KEY });

  // Tier 6
  if (process.env.OPENAI_API_KEY)
    await getConnector('openai').connect({ apiKey: process.env.OPENAI_API_KEY });
  if (process.env.PERPLEXITY_API_KEY)
    await getConnector('perplexity-search').connect({ apiKey: process.env.PERPLEXITY_API_KEY });

  console.log(`[Connectors] ${listConnectors().length} connectors ready`);
  console.log(`[Connectors] Active: ${listConnectors().join(', ')}`);
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
