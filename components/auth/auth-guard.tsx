"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/providers/app-provider";

const ROUTES_WITHOUT_EVENT = ["/events", "/profile", "/team"];

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentEvent, eventsLoaded, eventsLoading } = useApp();

  const allowsNoEvent =
    ROUTES_WITHOUT_EVENT.includes(pathname) || pathname.startsWith("/join");

  useEffect(() => {
    if (!eventsLoaded || eventsLoading || allowsNoEvent || currentEvent) return;
    router.replace("/events");
  }, [allowsNoEvent, currentEvent, eventsLoaded, eventsLoading, router]);

  if (!eventsLoaded || eventsLoading) {
    return <>{children}</>;
  }

  if (!currentEvent && !allowsNoEvent) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Redirecting to events…
      </main>
    );
  }

  return <>{children}</>;
}
