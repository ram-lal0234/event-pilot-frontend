"use client";

import { ArrowRight, MessageCircle } from "lucide-react";
import { EventSettingsSheet } from "@/components/domain/events/event-settings-sheet";
import type { OutreachSummary } from "@/lib/outreach";
import { useEventAccess } from "@/hooks/use-event-access";
import { cn } from "@/lib/utils";

type OutreachTeaserProps = {
  eventId: string;
  outreach: OutreachSummary | null;
  pendingRsvp?: number;
};

function outreachSubtitle(outreach: OutreachSummary, pendingRsvp: number): string {
  if (!outreach.enabled) {
    return `${pendingRsvp} pending RSVP · enable WhatsApp → call → reminder in event settings`;
  }

  const { awaiting, needsPlanner, complete } = outreach.counts;
  const inProgress = outreach.nextSteps.find((s) => s.status === "in_progress");
  if (inProgress) {
    return inProgress.title;
  }

  if (needsPlanner > 0) {
    return `${needsPlanner} need follow-up · ${awaiting} awaiting RSVP · ${complete} complete`;
  }

  return `${awaiting} awaiting RSVP · ${complete} complete · manage guests and send invites`;
}

function outreachBadge(outreach: OutreachSummary): { label: string; active: boolean } {
  if (!outreach.enabled) {
    return { label: "Not enabled", active: false };
  }
  const inProgress = outreach.nextSteps.some((s) => s.status === "in_progress");
  if (inProgress) {
    return { label: "In progress", active: true };
  }
  const allDone = outreach.nextSteps.every((s) => s.status === "done");
  if (allDone && outreach.nextSteps.length > 0) {
    return { label: "On track", active: true };
  }
  return { label: "Active", active: true };
}

export function OutreachTeaser({ eventId, outreach, pendingRsvp = 0 }: OutreachTeaserProps) {
  const { canWrite } = useEventAccess();

  if (!outreach) {
    return null;
  }

  const subtitle = outreachSubtitle(outreach, pendingRsvp ?? outreach.pendingRsvp);
  const badge = outreachBadge(outreach);

  return (
    <EventSettingsSheet
      eventId={eventId}
      canWrite={canWrite}
      trigger={
        <button
          type="button"
          className="flex h-full w-full items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">WhatsApp-first RSVP outreach</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex",
                badge.active
                  ? "bg-status-success/15 text-status-success"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {badge.label}
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </span>
        </button>
      }
    />
  );
}
