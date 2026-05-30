import {
  RealtimeClient,
  resolveRealtimeWsUrl,
  type RealtimeClientState,
} from "@/lib/realtime/client";
import { getOrCreateRealtimeClientId } from "@/lib/realtime/client-id";
import type { RealtimeMessage } from "@/lib/realtime/types";

type SharedClientOptions = {
  token: string;
  eventId?: string;
  onMessage: (message: RealtimeMessage) => void;
  onStateChange?: (state: RealtimeClientState) => void;
};

let sharedClient: RealtimeClient | null = null;
let pendingStopTimer: ReturnType<typeof setTimeout> | null = null;
let activeSessionKey: string | null = null;
let activeToken = "";

function sessionKey(url: string, token: string, clientId: string) {
  return `${url}|${clientId}|${token.length}:${token.slice(-12)}`;
}

function cancelPendingStop() {
  if (pendingStopTimer) {
    clearTimeout(pendingStopTimer);
    pendingStopTimer = null;
  }
}

function stopSharedClient() {
  sharedClient?.stop();
  sharedClient = null;
  activeSessionKey = null;
}

/** One WebSocket per browser session — survives React Strict Mode remounts. */
export function acquireSharedRealtimeClient(options: SharedClientOptions): RealtimeClient | null {
  cancelPendingStop();

  const url = resolveRealtimeWsUrl();
  if (!url || !options.token) {
    scheduleSharedClientStop();
    return null;
  }

  const clientId = getOrCreateRealtimeClientId();
  const key = sessionKey(url, options.token, clientId);
  activeToken = options.token;

  if (sharedClient && activeSessionKey !== key) {
    stopSharedClient();
  }

  if (!sharedClient) {
    sharedClient = new RealtimeClient({
      url,
      clientId,
      getToken: () => activeToken,
      eventId: options.eventId,
      onMessage: options.onMessage,
      onStateChange: options.onStateChange,
    });
    activeSessionKey = key;
    sharedClient.start();
    return sharedClient;
  }

  sharedClient.updateHandlers(options.onMessage, options.onStateChange);
  activeToken = options.token;
  sharedClient.setEventId(options.eventId);
  return sharedClient;
}

/** Deferred stop so Strict Mode remount can cancel teardown before the socket closes. */
export function scheduleSharedClientStop() {
  cancelPendingStop();
  pendingStopTimer = setTimeout(() => {
    pendingStopTimer = null;
    stopSharedClient();
  }, 0);
}

export function getSharedRealtimeClient() {
  return sharedClient;
}
