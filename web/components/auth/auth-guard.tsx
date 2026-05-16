"use client";

import type { ReactNode } from "react";
import { Loader2, Rocket } from "lucide-react";
import { EmptyEventState, useApp } from "@/components/providers/app-provider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { currentEvent, eventsLoaded, eventsLoading } = useApp();

  if (!eventsLoaded || eventsLoading) {
    return <WorkspaceLoadingState />;
  }

  if (!currentEvent) {
    return <EmptyEventState />;
  }

  return <>{children}</>;
}

function WorkspaceLoadingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
          <Rocket className="size-6" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Loading workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Preparing your events and dashboard context.
        </p>
        <Loader2 className="mt-5 size-5 animate-spin text-muted-foreground" />
      </div>
    </main>
  );
}
