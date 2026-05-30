const CLIENT_ID_KEY = "eventpilot.realtime.clientId";

let cachedClientId: string | null = null;

/** Stable per-browser id (localStorage) — multiple tabs share it; server dedupes stale sockets. */
export function getOrCreateRealtimeClientId(): string {
  if (typeof window === "undefined") {
    return "ssr";
  }

  const stored = window.localStorage.getItem(CLIENT_ID_KEY);
  if (stored && isValidClientId(stored)) {
    cachedClientId = stored;
    return stored;
  }

  if (cachedClientId) {
    return cachedClientId;
  }

  const id = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, id);

  const winner = window.localStorage.getItem(CLIENT_ID_KEY);
  cachedClientId = winner && isValidClientId(winner) ? winner : id;
  return cachedClientId;
}

export function isValidClientId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
