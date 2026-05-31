"use client";

import { CalendarDays, Copy, Settings, UserX, UserCheck } from "lucide-react";
import type { TeamMemberRecord } from "@/lib/api";
import { UserAvatar } from "@/components/layout/user-avatar";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<TeamMemberRecord["role"], string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  STAFF: "Staff",
  DRIVER: "Driver",
  HOTEL: "Hotel",
};

function memberStatus(member: TeamMemberRecord) {
  if (member.status === "REVOKED") {
    return { label: "Suspended", variant: "error" as const };
  }
  if (member.status === "PENDING") {
    return { label: "Pending invite", variant: "warning" as const };
  }
  if (member.status === "ACCEPTED") {
    return { label: "Active", variant: "success" as const };
  }
  return { label: member.status, variant: "neutral" as const };
}

function EventAccessSummary({
  eventAccess,
}: {
  eventAccess: TeamMemberRecord["eventAccess"];
}) {
  const count = eventAccess.length;

  if (count === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-surface-container-low px-3 py-2 text-sm text-muted-foreground">
        No events assigned yet.
      </p>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface-container-low px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
            aria-label={`${count} event${count === 1 ? "" : "s"} assigned — view details`}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {count} event{count === 1 ? "" : "s"}
              </span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">View</span>
          </button>
        }
      />
      <PopoverContent align="start" side="bottom" className="w-72 p-0">
        <PopoverHeader className="border-b border-border px-3 py-2.5">
          <PopoverTitle className="text-sm">Event access</PopoverTitle>
        </PopoverHeader>
        <ul className="max-h-56 overflow-y-auto p-2">
          {eventAccess.map((grant) => (
            <li
              key={grant.eventId}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <span className="min-w-0 truncate font-medium text-foreground">
                {grant.eventName || "Event"}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {grant.accessLevel === "FULL" ? "Full" : "Read only"}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function TeamMemberCard({
  member,
  onManage,
  onCopyInvite,
  onSuspend,
  onReactivate,
}: {
  member: TeamMemberRecord;
  onManage: () => void;
  onCopyInvite: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  const displayName = member.name || member.email;
  const status = memberStatus(member);
  const isOwner = member.role === "OWNER";
  const eventAccess = member.eventAccess;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-card p-4 shadow-sm",
        member.status === "REVOKED" && "opacity-85",
      )}
    >
      <div className="flex items-start gap-3">
        <UserAvatar email={member.email} name={member.name} size="lg" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-foreground">{displayName}</h2>
          {member.name ? (
            <p className="truncate text-sm text-muted-foreground">{member.email}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge variant={isOwner ? "vip" : "neutral"}>{ROLE_LABELS[member.role]}</StatusBadge>
            <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1">
        {isOwner ? (
          <p className="text-sm text-muted-foreground">Full workspace access on all events.</p>
        ) : (
          <EventAccessSummary eventAccess={eventAccess} />
        )}
      </div>

      {!isOwner ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {member.status === "PENDING" && (member.inviteUrl || member.inviteCode) ? (
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onCopyInvite}>
              <Copy className="size-3.5" />
              Copy invite
            </Button>
          ) : null}
          {member.status !== "REVOKED" ? (
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onManage}>
              <Settings className="size-3.5" />
              Manage
            </Button>
          ) : null}
          {member.status === "REVOKED" ? (
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onReactivate}>
              <UserCheck className="size-3.5" />
              Reactivate
            </Button>
          ) : (
            <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={onSuspend}>
              <UserX className="size-3.5" />
              Suspend
            </Button>
          )}
        </div>
      ) : null}
    </article>
  );
}
