"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { scopedEventHref } from "@/lib/design-tokens";
import { useApp } from "@/components/providers/app-provider";

const GLOBAL_PATHS = new Set(["/events", "/team", "/profile", "/login"]);

const LEGACY_EVENT_PATHS = new Set([
  "/",
  "/guests",
  "/whatsapp",
  "/follow-up",
  "/operations",
  "/check-in",
  "/live",
  "/analytics",
  "/reports",
  "/call-logs",
]);

/** Keep URL, selected event, and page state aligned when switching events. */
export function EventRouteSync({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentEventId, setCurrentEventId } = useApp();

  useEffect(() => {
    const match = pathname.match(/^\/events\/([^/]+)/);
    const urlEventId = match?.[1];
    if (urlEventId && urlEventId !== currentEventId) {
      setCurrentEventId(urlEventId);
    }
  }, [pathname, currentEventId, setCurrentEventId]);

  useEffect(() => {
    if (!currentEventId) return;
    if (GLOBAL_PATHS.has(pathname)) return;
    if (pathname.startsWith("/events/") || pathname.startsWith("/fieldops") || pathname.startsWith("/rsvp")) {
      return;
    }
    if (LEGACY_EVENT_PATHS.has(pathname)) {
      router.replace(scopedEventHref(currentEventId, pathname));
    }
  }, [pathname, currentEventId, router]);

  return <div key={currentEventId || "no-event"}>{children}</div>;
}
