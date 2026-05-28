"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, LogOut, ScanLine, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { scopedEventHref } from "@/lib/design-tokens";
import { userDisplayName } from "@/lib/user-display";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/layout/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  mobileMenu: ReactNode;
}

export function TopBar({ mobileMenu }: TopBarProps) {
  const { user, logout, account, membership, currentEventId } = useApp();
  const { isOwner } = useEventAccess();
  const displayName = userDisplayName(membership?.name, user.email);
  const checkInHref = scopedEventHref(currentEventId, "/check-in");

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
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground lg:inline">
            {account.name}
          </span>
        ) : null}

        <Button
          size="sm"
          className="gap-1.5"
          render={<Link href={checkInHref} />}
          nativeButton={false}
        >
          <ScanLine className="size-4" />
          <span className="hidden sm:inline">Check-in</span>
        </Button>

        <span className="hidden rounded-md bg-surface-container-low px-2.5 py-1.5 text-xs font-medium text-muted-foreground md:inline">
          Free tier
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-9 overflow-hidden rounded-full p-0"
                type="button"
                aria-label="Account menu"
              />
            }
          >
            <UserAvatar
              email={user.email}
              name={membership?.name}
              size="default"
              className="pointer-events-none"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-1rem)]">
            <DropdownMenuGroup>
              <div className="flex items-center gap-3 px-2 py-2.5">
                <UserAvatar email={user.email} name={membership?.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-3 px-2 py-2"
                render={<Link href="/profile" />}
                nativeButton={false}
              >
                <Building2 className="size-4" />
                Profile
              </DropdownMenuItem>
              {isOwner ? (
                <DropdownMenuItem
                  className="gap-3 px-2 py-2"
                  render={<Link href="/team" />}
                  nativeButton={false}
                >
                  <Users className="size-4" />
                  Team
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                className="gap-3 px-2 py-2"
                onClick={logout}
              >
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
