import type { CommandMessage, ChannelResponse } from '../types';

export class TelegramChannel {
  private botToken: string;

  constructor(botToken?: string) {
    this.botToken = botToken ?? process.env.TELEGRAM_BOT_TOKEN ?? '';
  }

  /**
   * Start listening for commands from Telegram via polling or webhook.
   * TODO: Integrate with node-telegram-bot-api or grammy
   */
  async listen(onMessage: (msg: CommandMessage) => Promise<ChannelResponse>): Promise<void> {
    console.log('[TelegramChannel] Starting listener...');
    // TODO: Initialise Telegram Bot API polling/webhook
  }

  /**
   * Send a reply to a Telegram chat.
   */
  async send(chatId: string, response: ChannelResponse): Promise<void> {
    console.log(`[TelegramChannel] Sending to ${chatId}:`, response.text);
    // TODO: POST to https://api.telegram.org/bot{token}/sendMessage
  }
}
