"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bell,
  Calendar,
  ChevronDown,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";
import { currentEvent } from "@/lib/design-tokens";
import { userAvatar } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tabs = ["Live View", "Analytics", "Reports"] as const;

interface TopBarProps {
  mobileMenu: ReactNode;
}

export function TopBar({ mobileMenu }: TopBarProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/";
  const { sidebarOpen, toggleSidebar } = useSidebar();

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
          <DropdownMenuTrigger className="flex max-w-[min(100%,11rem)] min-w-0 items-center gap-2 rounded border border-border bg-surface-container-low px-2 py-1.5 text-left text-xs font-semibold text-text-main sm:max-w-[18rem] sm:py-2 sm:text-sm sm:leading-tight lg:max-w-none">
            <Calendar className="size-4 shrink-0 text-primary" />
            <span className="truncate">{currentEvent.name}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>{currentEvent.name}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <nav className="hidden md:flex md:gap-3 lg:gap-6 xl:gap-8">
          {tabs.map((tab) => (
            <span
              key={tab}
              className={cn(
                "cursor-default whitespace-nowrap text-sm transition-colors",
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

      <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4">
        <Link
          href="/check-in"
          className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground sm:px-3 sm:text-sm"
        >
          <QrCode className="size-4 shrink-0" />
          <span className="hidden sm:inline">Check-In Mode</span>
        </Link>
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
          <Avatar className="size-8 shrink-0 border border-border sm:size-9">
            <AvatarImage src={userAvatar} alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
