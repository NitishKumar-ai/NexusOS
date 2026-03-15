import { FirebaseConnector }       from './firebase';
import { GitHubConnector }         from './github';
import { LinearConnector }         from './linear';
import { FigmaConnector }          from './figma';
import { SlackConnector }          from './slack';
import { NotionConnector }         from './notion';
import { JiraConnector }           from './jira';
import { GoogleCalendarConnector } from './google-calendar';
import { GmailConnector }          from './gmail';
import { VercelConnector }         from './vercel';
import { SupabaseConnector }       from './supabase';
import { SentryConnector }         from './sentry';
import { StripeConnector }         from './stripe';
import { ResendConnector }         from './resend';
import { OpenAIConnector }         from './openai';
import { PerplexityConnector }     from './perplexity-search';
import { RailwayConnector }        from './railway';
import { AWSS3Connector }          from './aws-s3';
import { CloudflareConnector }     from './cloudflare';
import { DockerHubConnector }      from './docker-hub';
import { DatadogConnector }        from './datadog';
import { PosthogConnector }        from './posthog';
import { PagerDutyConnector }      from './pagerduty';
import { HuggingFaceConnector }    from './huggingface';
import { AnthropicConnector }      from './anthropic-api';
import type { MCPConnector }       from './types';

export type { MCPConnector, ConnectorConfig, ConnectorResult } from './types';

const connectors: Record<string, MCPConnector> = {
  firebase:           new FirebaseConnector(),
  github:             new GitHubConnector(),
  linear:             new LinearConnector(),
  figma:              new FigmaConnector(),
  slack:              new SlackConnector(),
  notion:             new NotionConnector(),
  jira:               new JiraConnector(),
  'google-calendar':  new GoogleCalendarConnector(),
  gmail:              new GmailConnector(),
  vercel:             new VercelConnector(),
  supabase:           new SupabaseConnector(),
  sentry:             new SentryConnector(),
  stripe:             new StripeConnector(),
  resend:             new ResendConnector(),
  openai:             new OpenAIConnector(),
  'perplexity-search': new PerplexityConnector(),
  railway:            new RailwayConnector(),
  'aws-s3':           new AWSS3Connector(),
  cloudflare:         new CloudflareConnector(),
  'docker-hub':       new DockerHubConnector(),
  datadog:            new DatadogConnector(),
  posthog:            new PosthogConnector(),
  pagerduty:          new PagerDutyConnector(),
  huggingface:        new HuggingFaceConnector(),
  'anthropic-api':    new AnthropicConnector(),
};

export function getConnector(name: string): MCPConnector {
  const c = connectors[name];
  if (!c) throw new Error(`Unknown connector: ${name}. Available: ${Object.keys(connectors).join(', ')}`);
  return c;
}

export function listConnectors(): string[] {
  return Object.keys(connectors);
}
