// NexusOS Channel Registry
// All channels implement CommandMessage interface + listen() function

export { DiscordChannel } from './discord';
export { TelegramChannel } from './telegram';
export { WhatsAppChannel } from './whatsapp';
export type { CommandMessage, ChannelResponse } from './types';
