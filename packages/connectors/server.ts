// packages/connectors/server.ts
// HTTP server that Rust Traffic Controller calls to execute connector actions
// Runs on port 3002

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { getConnector, listConnectors } from './index';

const PORT = process.env.CONNECTOR_PORT ? parseInt(process.env.CONNECTOR_PORT) : 3002;

async function safeConnect(name: string, config: any) {
  try {
    await getConnector(name).connect(config);
  } catch (err) {
    console.warn(`[Connectors] Failed to connect ${name}:`, err instanceof Error ? err.message : err);
  }
}

// Load connector configs from environment
async function initConnectors() {
  // Tier 1 — already working
  await safeConnect('firebase', {
    projectId:   process.env.FIREBASE_PROJECT_ID,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });

  await safeConnect('github', { apiKey: process.env.GITHUB_TOKEN });
  await safeConnect('linear', { apiKey: process.env.LINEAR_API_KEY });
  await safeConnect('figma', { apiKey: process.env.FIGMA_TOKEN });

  // Tier 2
  if (process.env.SLACK_BOT_TOKEN)
    await safeConnect('slack', { apiKey: process.env.SLACK_BOT_TOKEN });
  if (process.env.NOTION_TOKEN)
    await safeConnect('notion', { apiKey: process.env.NOTION_TOKEN });
  if (process.env.JIRA_TOKEN)
    await safeConnect('jira', { apiKey: process.env.JIRA_TOKEN, email: process.env.JIRA_EMAIL, domain: process.env.JIRA_DOMAIN });
  if (process.env.GOOGLE_ACCESS_TOKEN)
    await safeConnect('google-calendar', { apiKey: process.env.GOOGLE_ACCESS_TOKEN });
  if (process.env.GOOGLE_ACCESS_TOKEN)
    await safeConnect('gmail', { apiKey: process.env.GOOGLE_ACCESS_TOKEN });

  // Tier 3
  if (process.env.VERCEL_TOKEN)
    await safeConnect('vercel', { apiKey: process.env.VERCEL_TOKEN });
  if (process.env.SUPABASE_URL)
    await safeConnect('supabase', { baseUrl: process.env.SUPABASE_URL, apiKey: process.env.SUPABASE_KEY });

  // Tier 4
  if (process.env.SENTRY_TOKEN)
    await safeConnect('sentry', { apiKey: process.env.SENTRY_TOKEN, orgSlug: process.env.SENTRY_ORG });

  // Tier 5
  if (process.env.STRIPE_SECRET_KEY)
    await safeConnect('stripe', { apiKey: process.env.STRIPE_SECRET_KEY });
  if (process.env.RESEND_API_KEY)
    await safeConnect('resend', { apiKey: process.env.RESEND_API_KEY });

  // Tier 6
  if (process.env.OPENAI_API_KEY)
    await safeConnect('openai', { apiKey: process.env.OPENAI_API_KEY });
  if (process.env.PERPLEXITY_API_KEY)
    await safeConnect('perplexity-search', { apiKey: process.env.PERPLEXITY_API_KEY });

  // v2 Expansion
  if (process.env.RAILWAY_TOKEN)
    await safeConnect('railway', { apiKey: process.env.RAILWAY_TOKEN });

  if (process.env.AWS_ACCESS_KEY_ID)
    await safeConnect('aws-s3', {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });

  if (process.env.CLOUDFLARE_TOKEN)
    await getConnector('cloudflare').connect({
      apiKey: process.env.CLOUDFLARE_TOKEN,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    });

  if (process.env.DOCKER_HUB_USERNAME)
    await getConnector('docker-hub').connect({
      username: process.env.DOCKER_HUB_USERNAME,
      apiKey: process.env.DOCKER_HUB_PASSWORD,
    });

  if (process.env.DD_API_KEY)
    await getConnector('datadog').connect({
      apiKey: process.env.DD_API_KEY,
      appKey: process.env.DD_APP_KEY,
      site: process.env.DD_SITE || 'datadoghq.com',
    });

  if (process.env.POSTHOG_API_KEY)
    await getConnector('posthog').connect({
      apiKey: process.env.POSTHOG_API_KEY,
      projectId: process.env.POSTHOG_PROJECT_ID,
      host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
    });

  if (process.env.PAGERDUTY_TOKEN)
    await getConnector('pagerduty').connect({ apiKey: process.env.PAGERDUTY_TOKEN });

  if (process.env.HUGGINGFACE_TOKEN)
    await getConnector('huggingface').connect({ apiKey: process.env.HUGGINGFACE_TOKEN });

  if (process.env.ANTHROPIC_API_KEY)
    await getConnector('anthropic-api').connect({ apiKey: process.env.ANTHROPIC_API_KEY });

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
