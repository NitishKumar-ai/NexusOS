// packages/workflow/src/connector.ts
// Call connector Worker from Workflow step

export async function callConnector(
  connectorsUrl: string,
  connector: string,
  action: string,
  params: Record<string, unknown>,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const res = await fetch(`${connectorsUrl}/connector/${connector}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json() as Promise<{ success: boolean; data?: unknown; error?: string }>;
  } catch (e) {
    return { success: false, error: `Connector unreachable: ${e}` };
  }
}
