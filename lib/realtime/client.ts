import { nextReconnectDelayMs } from "@/lib/realtime/backoff";
import type { RealtimeMessage } from "@/lib/realtime/types";

/** Below API Gateway ~10m idle timeout; pair with pong watchdog. */
const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
const MAX_RECONNECT_ATTEMPTS = 15;

export type RealtimeClientState =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "failed";

export type RealtimeClientOptions = {
  url: string;
  clientId: string;
  getToken: () => string;
  eventId?: string;
  onMessage: (message: RealtimeMessage) => void;
  onStateChange?: (state: RealtimeClientState) => void;
};

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private stopped = false;
  private displaced = false;
  private subscribedEventId: string | undefined;
  private awaitingPong = false;
  private visibilityHandler: (() => void) | null = null;

  constructor(private options: RealtimeClientOptions) {
    this.subscribedEventId = options.eventId;
  }

  start() {
    if (
      !this.stopped
      && this.ws
      && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.stopped = false;
    this.displaced = false;
    this.reconnectAttempt = 0;
    this.bindVisibilityRecovery();
    this.connect();
  }

  updateHandlers(
    onMessage: RealtimeClientOptions["onMessage"],
    onStateChange?: RealtimeClientOptions["onStateChange"],
  ) {
    this.options.onMessage = onMessage;
    this.options.onStateChange = onStateChange;
  }

  stop() {
    this.stopped = true;
    this.awaitingPong = false;
    this.unbindVisibilityRecovery();
    this.clearTimers();
    this.closeActiveSocket();
    this.options.onStateChange?.("idle");
  }

  setEventId(eventId: string | undefined) {
    this.subscribedEventId = eventId;
    this.sendSubscribe();
  }

  /** Ignore events from sockets superseded by a newer connect(). */
  private isActiveSocket(ws: WebSocket): boolean {
    return ws === this.ws;
  }

  private bindVisibilityRecovery() {
    if (typeof document === "undefined" || this.visibilityHandler) {
      return;
    }

    this.visibilityHandler = () => {
      if (document.visibilityState !== "visible" || this.stopped) {
        return;
      }

      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.reconnectAttempt = 0;
        this.scheduleReconnect(0);
        return;
      }

      // Half-open after idle: socket looks OPEN but server dropped it — probe now.
      if (this.ws.readyState === WebSocket.OPEN && !this.awaitingPong) {
        this.sendPing();
      }
    };

    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  private unbindVisibilityRecovery() {
    if (this.visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  private connect() {
    if (this.stopped) {
      return;
    }

    if (
      this.ws?.readyState === WebSocket.OPEN
      || this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.clearReconnect();
    this.closeActiveSocket();
    this.awaitingPong = false;
    this.displaced = false;
    this.options.onStateChange?.(
      this.reconnectAttempt > 0 ? "reconnecting" : "connecting",
    );

    const token = this.options.getToken();
    if (!token) {
      this.options.onStateChange?.("failed");
      return;
    }

    const params = new URLSearchParams({
      token,
      clientId: this.options.clientId,
    });

    if (this.subscribedEventId) {
      params.set("eventId", this.subscribedEventId);
    }

    const ws = new WebSocket(`${this.options.url}?${params.toString()}`);
    this.ws = ws;

    ws.onopen = () => {
      if (!this.isActiveSocket(ws)) {
        return;
      }

      this.options.onStateChange?.("open");
      this.sendSubscribe();
      this.sendPing();
      this.startPingLoop();
    };

    ws.onmessage = (event) => {
      if (!this.isActiveSocket(ws)) {
        return;
      }

      try {
        const message = JSON.parse(String(event.data)) as RealtimeMessage;

        if (message.type === "pong") {
          this.onPongReceived();
          return;
        }

        if (message.type === "replaced") {
          this.displaced = true;
          ws.close(4000, "replaced");
          return;
        }

        if (message.type === "connected" || message.type === "subscribed") {
          return;
        }

        this.options.onMessage(message);
      } catch {
        // ignore non-JSON frames
      }
    };

    ws.onclose = (event) => {
      if (!this.isActiveSocket(ws)) {
        return;
      }

      this.stopPingLoop();
      this.clearPongWatchdog();
      this.awaitingPong = false;
      this.ws = null;

      if (this.stopped || this.displaced || event.code === 4000) {
        this.options.onStateChange?.("idle");
        return;
      }

      this.scheduleReconnect();
    };

    ws.onerror = () => {
      if (!this.isActiveSocket(ws)) {
        return;
      }

      ws.close();
    };
  }

  private onPongReceived() {
    this.awaitingPong = false;
    this.reconnectAttempt = 0;
    this.clearPongWatchdog();
  }

  private sendPing() {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    if (this.awaitingPong) {
      this.ws.close(4001, "pong timeout");
      return;
    }

    this.awaitingPong = true;
    this.ws.send(JSON.stringify({ action: "ping" }));

    this.clearPongWatchdog();
    this.pongTimer = setTimeout(() => {
      if (this.awaitingPong && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.close(4001, "pong timeout");
      }
    }, PONG_TIMEOUT_MS);
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingTimer = setInterval(() => this.sendPing(), PING_INTERVAL_MS);
  }

  private stopPingLoop() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearPongWatchdog() {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private sendSubscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.subscribedEventId) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        action: "subscribe",
        eventId: this.subscribedEventId,
      }),
    );
  }

  private scheduleReconnect(immediateMs?: number) {
    if (this.stopped) {
      return;
    }

    this.clearReconnect();

    if (this.reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      this.options.onStateChange?.("failed");
      return;
    }

    const delay =
      immediateMs !== undefined
        ? immediateMs
        : nextReconnectDelayMs(this.reconnectAttempt);

    this.reconnectAttempt += 1;
    this.options.onStateChange?.("reconnecting");

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private closeActiveSocket() {
    if (!this.ws) {
      return;
    }

    this.ws.onclose = null;
    this.ws.onerror = null;
    this.ws.onmessage = null;
    this.ws.onopen = null;
    this.ws.close();
    this.ws = null;
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearTimers() {
    this.clearReconnect();
    this.stopPingLoop();
    this.clearPongWatchdog();
  }
}

export function resolveRealtimeWsUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "development") {
    return "ws://127.0.0.1:4001";
  }

  return null;
}
