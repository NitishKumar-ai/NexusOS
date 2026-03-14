// WhatsApp channel adapter for NexusOS
// Wraps OpenClaw's normalize and resolve-outbound-target utilities

export { normalize } from './normalize';
export { resolveOutboundTarget } from './resolve-outbound-target';

import type { CommandMessage, ChannelResponse } from '../types';

export class WhatsAppChannel {
  private token: string;

  constructor(token?: string) {
    this.token = token ?? process.env.WHATSAPP_TOKEN ?? '';
  }

  /**
   * Start listening for commands from WhatsApp via webhook.
   * Uses OpenClaw's normalize utility to parse incoming messages.
   */
  async listen(onMessage: (msg: CommandMessage) => Promise<ChannelResponse>): Promise<void> {
    console.log('[WhatsAppChannel] Starting listener...');
    // TODO: Register webhook endpoint and process incoming messages via normalize()
  }

  /**
   * Send a reply to a WhatsApp number.
   */
  async send(to: string, response: ChannelResponse): Promise<void> {
    console.log(`[WhatsAppChannel] Sending to ${to}:`, response.text);
    // TODO: POST to WhatsApp Cloud API
  }
}
