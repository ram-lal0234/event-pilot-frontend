/** Exponential backoff with 50–100% jitter (websocket.org / thundering-herd mitigation). */
export function nextReconnectDelayMs(
  attempt: number,
  {
    baseMs = 500,
    maxMs = 30_000,
  }: { baseMs?: number; maxMs?: number } = {},
): number {
  const exponential = Math.min(baseMs * 2 ** attempt, maxMs);
  const jitterMultiplier = 0.5 + Math.random() * 0.5;
  return Math.floor(exponential * jitterMultiplier);
}
