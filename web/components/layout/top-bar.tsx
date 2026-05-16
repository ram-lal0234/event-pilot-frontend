"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  ChevronDown,
  HelpCircle,
  QrCode,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tabs = ["Live View", "Analytics", "Reports"] as const;

export function TopBar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/";
  const { currentEvent, events, setCurrentEventId, user, logout } = useApp();

  return (
    <header className="fixed top-0 right-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 md:w-[calc(100%-16rem)] md:px-8">
      <div className="flex items-center gap-8">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded border border-border bg-surface-container-low px-4 py-1.5 text-sm font-semibold text-text-main">
            <Calendar className="size-4 text-primary" />
            {currentEvent?.name}
            <ChevronDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {events.map((event) => (
              <DropdownMenuItem key={event.id} onClick={() => setCurrentEventId(event.id)}>
                {event.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <nav className="hidden items-center gap-6 md:flex">
          {tabs.map((tab) => (
            <span
              key={tab}
              className={cn(
                "cursor-default text-sm transition-colors",
                tab === "Live View" && isDashboard
                  ? "border-b-2 border-primary pb-1 font-semibold text-primary"
                  : "text-muted-foreground"
              )}
            >
              {tab}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/check-in"
          className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <QrCode className="size-4" />
          Check-In Mode
        </Link>
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <Button variant="ghost" size="icon" type="button" aria-label="Notifications">
            <Bell className="size-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" type="button" aria-label="Help">
            <HelpCircle className="size-5 text-muted-foreground" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="size-8 border border-border">
                <AvatarFallback>{user.email[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-muted-foreground">{user.email}</DropdownMenuItem>
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
