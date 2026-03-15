// packages/connectors/src/worker.ts
// Cloudflare Workers entry point — stateless, edge-deployed

import { getConnector, listConnectors } from '../index';

export interface Env {
  NEXUSOS_KV: KVNamespace;
  NEXUSOS_R2: R2Bucket;
  NEXUSOS_D1: D1Database;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  GITHUB_TOKEN: string;
  LINEAR_API_KEY: string;
  FIGMA_TOKEN: string;
  SLACK_BOT_TOKEN: string;
  NOTION_TOKEN: string;
  STRIPE_SECRET_KEY: string;
  OPENAI_API_KEY: string;
  PERPLEXITY_API_KEY: string;
  RAILWAY_TOKEN: string;
  DD_API_KEY: string;
  DD_APP_KEY: string;
  [key: string]: unknown;
}

let initialized = false;

async function safeInit(env: Env) {
  if (initialized) return;
  const inits = [
    env.FIREBASE_PROJECT_ID && getConnector('firebase').connect({
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: (env.FIREBASE_PRIVATE_KEY as string)?.replace(/\\n/g, '\n'),
      clientEmail: env.FIREBASE_CLIENT_EMAIL as string,
    }),
    env.GITHUB_TOKEN && getConnector('github').connect({ apiKey: env.GITHUB_TOKEN as string }),
    env.LINEAR_API_KEY && getConnector('linear').connect({ apiKey: env.LINEAR_API_KEY as string }),
    env.FIGMA_TOKEN && getConnector('figma').connect({ apiKey: env.FIGMA_TOKEN as string }),
    env.SLACK_BOT_TOKEN && getConnector('slack').connect({ apiKey: env.SLACK_BOT_TOKEN as string }),
    env.NOTION_TOKEN && getConnector('notion').connect({ apiKey: env.NOTION_TOKEN as string }),
    env.OPENAI_API_KEY && getConnector('openai').connect({ apiKey: env.OPENAI_API_KEY as string }),
    env.PERPLEXITY_API_KEY && getConnector('perplexity-search').connect({ apiKey: env.PERPLEXITY_API_KEY as string }),
    env.DD_API_KEY && getConnector('datadog').connect({ apiKey: env.DD_API_KEY as string, appKey: env.DD_APP_KEY as string }),
  ].filter(Boolean);

  await Promise.allSettled(inits);
  initialized = true;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for dashboard
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json(
        { status: 'ok', connectors: listConnectors().length, env: 'cloudflare-workers' },
        { headers: corsHeaders }
      );
    }

    // List connectors
    if (url.pathname === '/connectors' && request.method === 'GET') {
      return Response.json(
        { connectors: listConnectors() },
        { headers: corsHeaders }
      );
    }

    // POST /connector/:name/:action
    const match = url.pathname.match(/^\/connector\/([^/]+)\/([^/]+)$/);
    if (!match || request.method !== 'POST') {
      return Response.json(
        { error: 'Not found. Use POST /connector/:name/:action' },
        { status: 404, headers: corsHeaders }
      );
    }

    const [, connectorName, action] = match;

    try {
      await safeInit(env);
      const params = await request.json() as Record<string, unknown>;
      const connector = getConnector(connectorName);
      const result = await connector.execute(action, params);

      return Response.json(result, {
        status: result.success ? 200 : 400,
        headers: corsHeaders,
      });
    } catch (err) {
      return Response.json({
        success: false,
        error: err instanceof Error ? err.message : 'Worker error',
        connector: connectorName,
        action,
      }, { status: 500, headers: corsHeaders });
    }
  }
};
