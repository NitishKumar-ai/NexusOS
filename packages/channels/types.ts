export interface CommandMessage {
  channel: 'discord' | 'telegram' | 'whatsapp';
  from: string;           // user identifier
  text: string;           // raw command text
  parsed?: {
    agent: string;        // e.g. "research-agent"
    task: string;         // e.g. "summarise last 10 Linear tickets"
    params: Record<string, string>;
  };
  timestamp: string;
  session_id?: string;
}

export interface ChannelResponse {
  to: string;
  text: string;
  trace_id: string;
  status: 'success' | 'refused' | 'error' | 'pending';
}
