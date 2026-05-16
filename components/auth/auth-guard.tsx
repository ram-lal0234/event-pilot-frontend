"use client";

import type { ReactNode } from "react";
import { EmptyEventState, useApp } from "@/components/providers/app-provider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { currentEvent, eventsLoaded, eventsLoading } = useApp();

  if (!eventsLoaded || eventsLoading) {
    return <>{children}</>;
  }

  if (!currentEvent) {
    return <EmptyEventState />;
  }

  return <>{children}</>;
}
