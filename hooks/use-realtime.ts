"use client";

import { useEffect, useRef } from "react";
import { getOrCreateRealtimeClientId } from "@/lib/realtime/client-id";
import {
  RealtimeClient,
  resolveRealtimeWsUrl,
  type RealtimeClientState,
} from "@/lib/realtime/client";
import type { RealtimeMessage } from "@/lib/realtime/types";

type UseRealtimeOptions = {
  token: string | null;
  eventId: string | undefined;
  enabled?: boolean;
  onMessage: (message: RealtimeMessage) => void;
  onStateChange?: (state: RealtimeClientState) => void;
};

export function useRealtime({
  token,
  eventId,
  enabled = true,
  onMessage,
  onStateChange,
}: UseRealtimeOptions) {
  const handlerRef = useRef(onMessage);
  const stateHandlerRef = useRef(onStateChange);
  const tokenRef = useRef(token);
  const clientRef = useRef<RealtimeClient | null>(null);

  handlerRef.current = onMessage;
  stateHandlerRef.current = onStateChange;
  tokenRef.current = token;

  useEffect(() => {
    const url = resolveRealtimeWsUrl();

    if (!enabled || !token || !url) {
      stateHandlerRef.current?.("idle");
      return;
    }

    const clientId = getOrCreateRealtimeClientId();
    const client = new RealtimeClient({
      url,
      clientId,
      getToken: () => tokenRef.current || "",
      eventId,
      onMessage: (message) => handlerRef.current(message),
      onStateChange: (state) => stateHandlerRef.current?.(state),
    });

    clientRef.current = client;
    client.start();

    return () => {
      clientRef.current = null;
      client.stop();
    };
    // eventId changes handled in separate effect — avoid reconnect storm
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, token]);

  useEffect(() => {
    clientRef.current?.setEventId(eventId);
  }, [eventId]);
}
