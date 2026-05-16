"use client";

import { useParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/components/providers/app-provider";

export function EventRouteSync({ children }: { children: ReactNode }) {
  const params = useParams<{ eventId?: string }>();
  const { currentEventId, setCurrentEventId } = useApp();
  const eventId = typeof params.eventId === "string" ? params.eventId : "";

  useEffect(() => {
    if (eventId && eventId !== currentEventId) {
      setCurrentEventId(eventId);
    }
  }, [currentEventId, eventId, setCurrentEventId]);

  return <>{children}</>;
}
