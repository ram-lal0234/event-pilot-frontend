const CLIENT_ID_KEY = "eventpilot.realtime.clientId";

/** Stable per-browser id (localStorage) — multiple tabs share it; server dedupes stale sockets. */
export function getOrCreateRealtimeClientId(): string {
  if (typeof window === "undefined") {
    return "ssr";
  }

  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing && isValidClientId(existing)) {
    return existing;
  }

  const id = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}

export function isValidClientId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
