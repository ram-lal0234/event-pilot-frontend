"use client";

import type { ReactNode } from "react";
import {
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";
import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const { user, logout } = useApp();
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const emailName = user.email.split("@")[0] || "User";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card",
        "left-0 px-3 sm:px-4",
        sidebarOpen ? "md:left-[238px]" : "md:left-0"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {mobileMenu}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden size-8 shrink-0 md:inline-flex"
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
      </div>

      <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-surface-container-low px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            Free tier
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="size-9 rounded-full" type="button" />}
            >
              <Avatar className="size-8 border border-border bg-foreground text-background">
                <AvatarFallback>{user.email[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-1rem)] p-0">
              <DropdownMenuItem className="gap-3 rounded-none border-b border-border p-4" onSelect={(event) => event.preventDefault()}>
                <Avatar className="size-10 bg-foreground text-background">
                  <AvatarFallback>{user.email[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate font-semibold capitalize text-foreground">{emailName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 px-4 py-2.5">
                <Building2 className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 px-4 py-2.5">
                <Users className="size-4" />
                Team Setup
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 px-4 py-2.5">
                <Shield className="size-4" />
                Account Limits
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 px-4 py-2.5">
                <Settings className="size-4" />
                Voice Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 border-t border-border px-4 py-3 text-destructive" onClick={logout}>
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    </header>
  );
}
