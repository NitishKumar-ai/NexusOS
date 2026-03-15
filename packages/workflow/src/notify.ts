// packages/workflow/src/notify.ts
// Notify developer via OpenClaw — routes to Discord/WhatsApp/Telegram automatically

export async function notifyViaOpenClaw(
  openclawUrl: string,
  sessionId: string,
  message: string,
): Promise<void> {
  try {
    const res = await fetch(`${openclawUrl}/api/v1/sessions/${sessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message, metadata: { source: 'nexusos' } }),
    });
    if (!res.ok) console.warn(`[OpenClaw] Notify failed: ${res.status}`);
  } catch (e) {
    console.warn(`[OpenClaw] Could not reach gateway: ${e}`);
  }
}

export function p2Message(taskId: string, plan: string): string {
  return `🟠 **P2 — Plan ready**\nMission: \`${taskId.slice(0, 8)}\`\n\n${plan}\n\n` +
    `/approve ${taskId} — proceed\n/reject ${taskId} — cancel\n/feedback ${taskId} "notes" — revise`;
}

export function p8Message(taskId: string, summary: string): string {
  return `✅ **P8 — Ready to commit**\nMission: \`${taskId.slice(0, 8)}\`\n\n${summary}\n\n` +
    `/approve ${taskId} — commit and push\n/reject ${taskId} — discard`;
}

export function phaseMessage(taskId: string, phase: string, detail: string): string {
  return `📡 **${phase}** — \`${taskId.slice(0, 8)}\`\n${detail}`;
}

export function blockerMessage(taskId: string, phase: string, reason: string): string {
  return `🔴 **Blocked at ${phase}**\nMission: \`${taskId.slice(0, 8)}\`\nReason: ${reason}\n\nReply \`/resume ${taskId}\` to continue`;
}
