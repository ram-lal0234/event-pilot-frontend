import { nextReconnectDelayMs } from "@/lib/realtime/backoff";
import type { RealtimeMessage } from "@/lib/realtime/types";

/** Below API Gateway ~10m idle timeout; pair with pong watchdog. */
const PING_INTERVAL_MS = 25_000;
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
  private subscribedEventId: string | undefined;
  private awaitingPong = false;
  private visibilityHandler: (() => void) | null = null;

  constructor(private readonly options: RealtimeClientOptions) {
    this.subscribedEventId = options.eventId;
  }

  start() {
    this.stopped = false;
    this.reconnectAttempt = 0;
    this.bindVisibilityRecovery();
    this.connect();
  }

  stop() {
    this.stopped = true;
    this.unbindVisibilityRecovery();
    this.clearTimers();
    this.ws?.close();
    this.ws = null;
    this.options.onStateChange?.("idle");
  }

  setEventId(eventId: string | undefined) {
    this.subscribedEventId = eventId;
    this.sendSubscribe();
  }

  private bindVisibilityRecovery() {
    if (typeof document === "undefined" || this.visibilityHandler) {
      return;
    }

    this.visibilityHandler = () => {
      if (document.visibilityState !== "visible" || this.stopped) {
        return;
      }

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.reconnectAttempt = 0;
        this.scheduleReconnect(0);
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

    this.clearReconnect();
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
      this.reconnectAttempt = 0;
      this.options.onStateChange?.("open");
      this.sendSubscribe();
      this.sendPing();
      this.startPingLoop();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as RealtimeMessage;

        if (message.type === "pong") {
          this.onPongReceived();
          return;
        }

        if (message.type === "replaced") {
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

    ws.onclose = () => {
      this.stopPingLoop();
      this.clearPongWatchdog();
      this.ws = null;

      if (this.stopped) {
        this.options.onStateChange?.("idle");
        return;
      }

      this.scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  private onPongReceived() {
    this.awaitingPong = false;
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
