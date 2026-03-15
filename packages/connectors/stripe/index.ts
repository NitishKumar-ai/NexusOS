import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class StripeConnector implements MCPConnector {
  name = 'stripe';
  version = '1.0.0';
  private key = '';

  async connect(config: ConnectorConfig) { this.key = config.apiKey ?? ''; }

  private async stripe(method: string, path: string, body?: Record<string, unknown>) {
    const auth = Buffer.from(`${this.key}:`).toString('base64');
    const res = await fetch(`https://api.stripe.com/v1${path}`, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body ? new URLSearchParams(body as Record<string, string>).toString() : undefined,
    });
    if (!res.ok) throw new Error(`Stripe ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      let data: unknown;
      switch (action) {
        case 'customer.list':   data = await this.stripe('GET', '/customers?limit=20'); break;
        case 'customer.get':    data = await this.stripe('GET', `/customers/${params.id}`); break;
        case 'payment.list':    data = await this.stripe('GET', '/payment_intents?limit=20'); break;
        case 'subscription.list': data = await this.stripe('GET', '/subscriptions?limit=20'); break;
        case 'revenue.summary':
          const charges = await this.stripe('GET', '/charges?limit=100') as { data: { amount: number; status: string }[] };
          data = {
            total: charges.data.reduce((sum: number, c) => sum + c.amount, 0) / 100,
            successful: charges.data.filter(c => c.status === 'succeeded').length,
          };
          break;
        default:
          return { success: false, error: `Unknown: ${action}`, action_id: randomUUID(), timestamp: new Date().toISOString() };
      }
      return { success: true, data, action_id: randomUUID(), timestamp: new Date().toISOString() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Stripe error', action_id: randomUUID(), timestamp: new Date().toISOString() };
    }
  }

  async disconnect() {}
}
