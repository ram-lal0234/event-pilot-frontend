"use client";

import Link from "next/link";
import { ArrowRight, PhoneCall, Radio } from "lucide-react";
import { useLiveCampaign } from "@/hooks/use-live-campaign";
import type { DashboardSummary } from "@/lib/api";
import { scopedEventHref } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type LiveCampaignTeaserProps = {
  eventId: string;
  summary: DashboardSummary | null;
};

export function LiveCampaignTeaser({ eventId, summary }: LiveCampaignTeaserProps) {
  const { activeCall, liveCounts, connectionState, connectionLabel, activeCallLabel } =
    useLiveCampaign(eventId, summary);

  const pending = summary?.pendingRsvp ?? liveCounts.pending;
  const live = connectionState === "open";

  return (
    <Link
      href={scopedEventHref(eventId, "/live")}
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-surface-container-low"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <PhoneCall className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Live campaign & operations</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {activeCall
              ? `Calling ${activeCall.guestName} — ${activeCallLabel}`
              : `${pending} pending RSVP · open the live war room for call progress and ops feed`}
          </p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex",
            live
              ? "bg-status-success/15 text-status-success"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Radio className={cn("size-2.5", live && "animate-pulse")} />
          {connectionLabel}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
      </span>
    </Link>
  );
}
