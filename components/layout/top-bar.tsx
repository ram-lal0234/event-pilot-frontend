"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, LogOut, Settings, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { scopedEventHref } from "@/lib/design-tokens";
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
  const { user, logout, account, currentEventId } = useApp();
  const { isOwner } = useEventAccess();
  const emailName = user.email.split("@")[0] || "User";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card",
        "left-0 px-3 sm:px-4 md:left-[238px]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">{mobileMenu}</div>

      <div className="flex shrink-0 items-center gap-2">
          {account?.name ? (
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground sm:inline">
              {account.name}
            </span>
          ) : null}
          {isOwner ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              render={<Link href={scopedEventHref(currentEventId, "/team")} />}
              nativeButton={false}
            >
              <Users className="size-4" />
              Team
            </Button>
          ) : null}
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
              <DropdownMenuItem
                className="gap-3 px-4 py-2.5"
                render={<Link href="/profile" />}
                nativeButton={false}
              >
                <Building2 className="size-4" />
                Profile
              </DropdownMenuItem>
              {isOwner ? (
                <DropdownMenuItem
                  className="gap-3 px-4 py-2.5"
                  render={<Link href="/team" />}
                  nativeButton={false}
                >
                  <Users className="size-4" />
                  Team
                </DropdownMenuItem>
              ) : null}
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
