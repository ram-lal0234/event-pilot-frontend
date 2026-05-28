"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarPlus, Check, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  brand,
  colors,
  eventViewItems,
  isEventHrefActive,
  navItems,
  scopedEventHref,
} from "@/lib/design-tokens";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { Button } from "@/components/ui/button";
import { CreateEventSheet } from "@/components/domain/events/create-event-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentEvent, currentEventId, events, setCurrentEventId } = useApp();
  const { isOwner } = useEventAccess();

  const onEventSelect = (nextEventId: string) => {
    if (!nextEventId || nextEventId === currentEventId) return;
    setCurrentEventId(nextEventId);
    router.push(scopedEventHref(nextEventId, getCurrentSection(pathname)));
  };

  return (
    <aside
      className={cn(
        "flex h-full w-[238px] flex-col border-r border-border bg-card",
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div
          className="flex size-7 items-center justify-center rounded text-white"
          style={{ backgroundColor: colors.primary }}
        >
          <Sparkles className="size-4" />
        </div>
        <h1 className="text-lg font-bold leading-none text-foreground">{brand.name}</h1>
      </div>

      <div className="px-2 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full justify-start gap-2 bg-card px-2 text-sm"
              />
            }
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-status-success-bg text-xs font-semibold">
              EP
            </span>
            <span className="min-w-0 flex-1 truncate text-left">
              {currentEvent?.name || "Select event"}
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px] p-1">
            {events.map((event) => (
              <DropdownMenuItem
                key={event.id}
                className="flex items-center gap-2"
                onClick={() => onEventSelect(event.id)}
              >
                <span className="truncate">{event.name}</span>
                {event.id === currentEventId ? (
                  <Check className="ml-auto size-4 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4">
        {navItems.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} currentEventId={currentEventId} />
        ))}
        <p className="px-2 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Event Views
        </p>
        {eventViewItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            pathname={pathname}
            currentEventId={currentEventId}
          />
        ))}
      </nav>
      {isOwner ? (
        <div className="border-t border-border p-3">
          <CreateEventSheet
            trigger={
              <Button variant="outline" className="w-full justify-start gap-2 bg-card" type="button">
                <CalendarPlus className="size-4" />
                Create Event
              </Button>
            }
          />
        </div>
      ) : null}
    </aside>
  );
}

function getCurrentSection(pathname: string) {
  if (pathname === "/" || /^\/events\/[^/]+\/dashboard$/.test(pathname)) {
    return "/";
  }
  if (/^\/events\/[^/]+\/(guests|follow-up|operations|check-in|live|analytics|reports|call-logs|team|events)$/.test(pathname)) {
    return pathname.replace(/^\/events\/[^/]+/, "");
  }
  if (/^\/(guests|follow-up|operations|check-in|live|analytics|reports|call-logs|team|events)$/.test(pathname)) {
    return pathname;
  }
  return "/";
}

function SidebarLink({
  item,
  pathname,
  currentEventId,
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
  pathname: string;
  currentEventId: string;
}) {
  const isActive = isEventHrefActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={scopedEventHref(currentEventId, item.href)}
      className={cn(
        "flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors",
        isActive
          ? "bg-surface-container-low font-medium text-foreground"
          : "text-muted-foreground hover:bg-surface-container-low hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
