"use client";

import { useEffect, useRef } from "react";
import {
  acquireSharedRealtimeClient,
  getSharedRealtimeClient,
  scheduleSharedClientStop,
} from "@/lib/realtime/shared-client";
import type { RealtimeClientState } from "@/lib/realtime/client";
import { resolveRealtimeWsUrl } from "@/lib/realtime/client";
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

  handlerRef.current = onMessage;
  stateHandlerRef.current = onStateChange;
  tokenRef.current = token;

  useEffect(() => {
    const url = resolveRealtimeWsUrl();

    if (!enabled || !token || !url) {
      stateHandlerRef.current?.("idle");
      scheduleSharedClientStop();
      return scheduleSharedClientStop;
    }

    acquireSharedRealtimeClient({
      token,
      eventId,
      onMessage: (message) => handlerRef.current(message),
      onStateChange: (state) => stateHandlerRef.current?.(state),
    });

    return scheduleSharedClientStop;
    // eventId changes handled in separate effect — avoid reconnect storm
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, token]);

  useEffect(() => {
    getSharedRealtimeClient()?.setEventId(eventId);
  }, [eventId]);
}
