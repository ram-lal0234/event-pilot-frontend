"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useApp } from "@/components/providers/app-provider";
import { useRealtime } from "@/hooks/use-realtime";
import type { RealtimeClientState } from "@/lib/realtime/client";
import { resolveRealtimeWsUrl } from "@/lib/realtime/client";
import type { RealtimeConnectionState, RealtimeMessage } from "@/lib/realtime/types";

type RealtimeListener = (message: RealtimeMessage) => void;

type RealtimeContextValue = {
  connectionState: RealtimeConnectionState;
  enabled: boolean;
  subscribe: (listener: RealtimeListener) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtimeBus() {
  const value = useContext(RealtimeContext);
  if (!value) {
    throw new Error("useRealtimeBus must be used inside RealtimeProvider");
  }
  return value;
}

function mapClientState(state: RealtimeClientState): RealtimeConnectionState {
  if (state === "idle") {
    return "idle";
  }
  return state;
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token, currentEventId } = useApp();
  const listenersRef = useRef(new Set<RealtimeListener>());
  const enabled = Boolean(resolveRealtimeWsUrl() && token);
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>(
    enabled ? "connecting" : "idle",
  );

  const subscribe = useCallback((listener: RealtimeListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const dispatch = useCallback((message: RealtimeMessage) => {
    for (const listener of listenersRef.current) {
      listener(message);
    }
  }, []);

  useRealtime({
    token,
    eventId: currentEventId || undefined,
    enabled,
    onMessage: dispatch,
    onStateChange: (state) => setConnectionState(mapClientState(state)),
  });

  const value = useMemo<RealtimeContextValue>(
    () => ({
      connectionState,
      enabled,
      subscribe,
    }),
    [connectionState, enabled, subscribe],
  );

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}
