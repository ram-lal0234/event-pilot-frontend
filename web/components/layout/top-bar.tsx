"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bell,
  Calendar,
  ChevronDown,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";
import { useSidebar } from "@/components/layout/sidebar-context";
import { eventViewItems, isEventHrefActive, scopedEventHref } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  mobileMenu: ReactNode;
}

export function TopBar({ mobileMenu }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentEvent, currentEventId, events, eventsLoaded, eventsLoading, setCurrentEventId, user, logout } = useApp();
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const workspaceLoading = !eventsLoaded || eventsLoading;

  const selectEvent = (eventId: string) => {
    setCurrentEventId(eventId);
    const eventRouteMatch = pathname.match(/^\/events\/[^/]+(\/.*)$/);
    if (eventRouteMatch) {
      router.replace(`/events/${eventId}${eventRouteMatch[1]}`);
      return;
    }
    router.replace(scopedEventHref(eventId, pathname));
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:h-16",
        "left-0 px-3 sm:gap-3 sm:px-4",
        sidebarOpen ? "md:left-64 md:px-4 lg:px-8" : "md:left-0 md:px-4 lg:px-8"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4 lg:gap-6">
        {mobileMenu}

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden shrink-0 border-border md:inline-flex"
          onClick={() => toggleSidebar()}
          aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-pressed={sidebarOpen}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="size-5" />
          ) : (
            <PanelLeftOpen className="size-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="max-w-[min(100%,11rem)] min-w-0 justify-start gap-2 bg-surface-container-low px-2 py-1.5 text-left text-xs font-semibold text-text-main sm:max-w-[18rem] sm:py-2 sm:text-sm sm:leading-tight lg:max-w-none"
                type="button"
              />
            }
          >
            <Calendar className="size-4 shrink-0 text-primary" />
            {workspaceLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <span className="truncate">{currentEvent?.name}</span>
            )}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {events.map((event) => (
              <DropdownMenuItem key={event.id} onClick={() => selectEvent(event.id)}>
                {event.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden h-6 w-px shrink-0 bg-border md:block" />

        <nav className="hidden min-w-0 items-center gap-2 overflow-x-auto md:flex lg:gap-4 xl:gap-6" aria-label="Event insights">
          {eventViewItems.map((item) => {
            const active = isEventHrefActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={scopedEventHref(currentEventId, item.href)}
                className={cn(
                  "whitespace-nowrap border-b-2 pb-1 text-sm transition-colors",
                  active
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4">
        <Button
          render={<Link href={scopedEventHref(currentEventId, "/check-in")} />}
          nativeButton={false}
          className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground sm:px-3 sm:text-sm"
        >
          <QrCode className="size-4 shrink-0" />
          <span className="hidden sm:inline">Check-In Mode</span>
        </Button>
        <div className="flex items-center gap-0 border-l border-border pl-2 sm:gap-2 sm:pl-3 md:gap-4 md:pl-4">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Notifications"
            className="size-9 shrink-0"
          >
            <Bell className="size-[1.125rem] text-muted-foreground sm:size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Help"
            className="hidden size-9 shrink-0 sm:inline-flex"
          >
            <HelpCircle className="size-[1.125rem] text-muted-foreground sm:size-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="size-9 rounded-full" type="button" />}
            >
              <Avatar className="size-8 border border-border">
                <AvatarFallback>{user.email[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-1rem)]">
              <DropdownMenuItem
                className="min-w-0 cursor-default text-muted-foreground focus:bg-transparent"
                title={user.email}
                onSelect={(event) => event.preventDefault()}
              >
                <span className="block min-w-0 truncate">{user.email}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
