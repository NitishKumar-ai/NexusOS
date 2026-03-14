import type { CommandMessage, ChannelResponse } from '../types';

export class DiscordChannel {
  private token: string;

  constructor(token?: string) {
    this.token = token ?? process.env.DISCORD_BOT_TOKEN ?? '';
  }

  /**
   * Start listening for commands from Discord.
   * TODO: Integrate with discord.js or discord-interactions
   */
  async listen(onMessage: (msg: CommandMessage) => Promise<ChannelResponse>): Promise<void> {
    console.log('[DiscordChannel] Starting listener...');
    // TODO: Initialise Discord gateway connection and parse slash commands
  }

  /**
   * Send a reply back to a Discord channel or user.
   */
  async send(channelId: string, response: ChannelResponse): Promise<void> {
    console.log(`[DiscordChannel] Sending to ${channelId}:`, response.text);
    // TODO: POST to Discord webhooks/API
  }
}
