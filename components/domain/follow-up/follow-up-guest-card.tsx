"use client";

import Link from "next/link";
import { CalendarClock, Phone, PhoneCall } from "lucide-react";
import type { GuestRecord } from "@/lib/api";
import { UserAvatar } from "@/components/layout/user-avatar";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scopedEventHref } from "@/lib/design-tokens";
import { formatCallbackAt } from "@/lib/format-callback-time";
import { cn } from "@/lib/utils";

type FollowUpStatus = NonNullable<GuestRecord["followUpStatus"]>;

const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  NONE: "Clear",
  NEEDS_FOLLOW_UP: "Needs follow-up",
  CALLBACK_LATER: "Callback later",
  NO_ANSWER: "No answer",
  VOICEMAIL: "Voicemail",
  COMPLETED: "Completed",
};

function followUpBadgeVariant(
  status: FollowUpStatus | undefined,
): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "CALLBACK_LATER":
      return "warning";
    case "NO_ANSWER":
    case "NEEDS_FOLLOW_UP":
      return "warning";
    default:
      return "neutral";
  }
}

function rsvpBadgeVariant(status: GuestRecord["rsvpStatus"]) {
  switch (status) {
    case "CONFIRMED":
      return "success" as const;
    case "DECLINED":
      return "error" as const;
    default:
      return "warning" as const;
  }
}

type FollowUpGuestCardProps = {
  guest: GuestRecord;
  currentEventId: string;
  busy: boolean;
  canWrite: boolean;
  canTriggerVoice: boolean;
  onStatusChange: (guestId: string, status: FollowUpStatus) => void;
  onCallNow: (guestId: string) => void;
};

export function FollowUpGuestCard({
  guest,
  currentEventId,
  busy,
  canWrite,
  canTriggerVoice,
  onStatusChange,
  onCallNow,
}: FollowUpGuestCardProps) {
  const status = guest.followUpStatus || "NEEDS_FOLLOW_UP";

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <UserAvatar email={guest.email ?? ""} name={guest.name} size="lg" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-foreground">{guest.name}</h2>
          <p className="truncate text-sm text-muted-foreground">{guest.phone}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge variant={followUpBadgeVariant(status)}>
              {FOLLOW_UP_LABELS[status]}
            </StatusBadge>
            <StatusBadge variant={rsvpBadgeVariant(guest.rsvpStatus)}>{guest.rsvpStatus}</StatusBadge>
          </div>
        </div>
      </div>

      {guest.guestNotes ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{guest.guestNotes}</p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No notes on file.</p>
      )}

      <div className="mt-4 flex-1" />

      <div className="mt-4 space-y-2">
        {canWrite ? (
          <Select
            value={status}
            disabled={busy}
            onValueChange={(next) => {
              if (next != null) {
                onStatusChange(guest.id, next as FollowUpStatus);
              }
            }}
          >
            <SelectTrigger className="w-full justify-between font-normal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="NEEDS_FOLLOW_UP">Needs follow-up</SelectItem>
              <SelectItem value="CALLBACK_LATER">Callback later</SelectItem>
              <SelectItem value="NO_ANSWER">No answer</SelectItem>
              <SelectItem value="VOICEMAIL">Voicemail</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="NONE">Clear</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {canTriggerVoice && guest.rsvpStatus === "PENDING" ? (
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() => onCallNow(guest.id)}
            >
              <PhoneCall className="size-3.5" />
              Call now
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            render={<Link href={scopedEventHref(currentEventId, "/guests")} />}
            nativeButton={false}
          >
            <Phone className="size-3.5" />
            Open in guests
          </Button>
        </div>
      </div>
    </article>
  );
}

type ScheduledCallbackCardProps = {
  guest: GuestRecord;
  busy: boolean;
  canWrite: boolean;
  canTriggerVoice: boolean;
  onCallNow: (guestId: string) => void;
  onReschedule: (guest: GuestRecord, value: string) => void;
  onCancel: () => void;
};

export function ScheduledCallbackCard({
  guest,
  busy,
  canWrite,
  canTriggerVoice,
  onCallNow,
  onReschedule,
  onCancel,
}: ScheduledCallbackCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border border-primary/25 bg-card p-4 shadow-sm",
        "ring-1 ring-primary/10",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-foreground">{guest.name}</h2>
          <p className="truncate text-sm text-muted-foreground">{guest.phone}</p>
          <p className="mt-1 text-sm font-medium text-primary">
            {formatCallbackAt(guest.callbackAt)}
            {guest.callbackTriggered ? " · call queued" : ""}
          </p>
        </div>
      </div>

      {guest.guestNotes ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{guest.guestNotes}</p>
      ) : null}

      <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
        {canTriggerVoice ? (
          <Button
            type="button"
            size="sm"
            className="w-full gap-2"
            disabled={busy || guest.rsvpStatus !== "PENDING"}
            onClick={() => onCallNow(guest.id)}
          >
            <PhoneCall className="size-4" />
            Call now
          </Button>
        ) : null}
        {canWrite ? (
          <>
            <Input
              type="datetime-local"
              className="w-full"
              defaultValue={guest.callbackAt ? guest.callbackAt.slice(0, 16) : ""}
              disabled={busy}
              onBlur={(event) => {
                if (event.target.value) {
                  onReschedule(guest, event.target.value);
                }
              }}
              aria-label={`Reschedule callback for ${guest.name}`}
            />
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancel}>
              Cancel callback
            </Button>
          </>
        ) : null}
      </div>
    </article>
  );
}
