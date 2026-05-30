"use client";

import Link from "next/link";
import { PhoneCall, Radio } from "lucide-react";
import { CallAllPendingButton } from "@/components/domain/guests/call-all-pending-button";
import { useLiveCampaign } from "@/hooks/use-live-campaign";
import type { DashboardSummary } from "@/lib/api";
import { scopedEventHref } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type LiveCampaignCardProps = {
  token: string;
  eventId: string;
  eventName: string;
  summary: DashboardSummary | null;
  canCallAll?: boolean;
};

export function LiveCampaignCard({
  token,
  eventId,
  eventName,
  summary,
  canCallAll = false,
}: LiveCampaignCardProps) {
  const {
    activeCall,
    recent,
    lastBulk,
    liveCounts,
    totalGuests,
    progressPercent,
    connectionLabel,
    connectionState,
    activeCallLabel,
  } = useLiveCampaign(eventId, summary);

  const live = connectionState === "open";

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <PhoneCall className="size-4 shrink-0 text-primary" />
            <span className="truncate">Live campaign — {eventName}</span>
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            RSVP outreach progress and call activity in real time.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
            live
              ? "bg-status-success/15 text-status-success"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Radio className={cn("size-3", live && "animate-pulse")} />
          {connectionLabel}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {liveCounts.confirmed} confirmed · {liveCounts.declined} declined ·{" "}
              {liveCounts.pending} pending
            </span>
            <span>{progressPercent}% responded</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {respondedLabel(liveCounts.confirmed, liveCounts.declined, totalGuests)}
          </p>
        </div>

        {lastBulk ? (
          <p className="rounded-md border border-border bg-surface-container-low px-3 py-2 text-xs text-muted-foreground">
            Last bulk queue: <span className="font-medium text-foreground">{lastBulk.queued}</span>{" "}
            queued
            {lastBulk.skipped > 0 ? (
              <>
                , <span className="font-medium text-foreground">{lastBulk.skipped}</span> skipped
              </>
            ) : null}
          </p>
        ) : null}

        <div className="rounded-lg border border-border bg-surface-container-low px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Currently calling
          </p>
          {activeCall ? (
            <p className="mt-1 text-sm font-medium text-foreground">
              {activeCall.guestName}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {activeCallLabel}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No active outbound call</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Recent outcomes
          </p>
          {recent.length ? (
            <ul className="space-y-2">
              {recent.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate font-medium text-foreground">{item.guestName}</span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium",
                      item.tone === "success" && "text-status-success",
                      item.tone === "error" && "text-status-error",
                      item.tone === "warning" && "text-status-warning",
                      item.tone === "muted" && "text-muted-foreground",
                    )}
                  >
                    {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Outcomes appear here as calls complete.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {canCallAll ? (
            <CallAllPendingButton
              token={token}
              eventId={eventId}
              pendingCount={liveCounts.pending}
              variant="default"
              size="sm"
              className="gap-2"
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            render={<Link href={scopedEventHref(eventId, "/guests")} />}
            nativeButton={false}
          >
            Guest list
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            render={<Link href={scopedEventHref(eventId, "/follow-up")} />}
            nativeButton={false}
          >
            Follow-up
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            render={<Link href={scopedEventHref(eventId, "/call-logs")} />}
            nativeButton={false}
          >
            Call logs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function respondedLabel(confirmed: number, declined: number, total: number) {
  const done = confirmed + declined;
  if (!total) return "No guests yet";
  return `${done} of ${total} guests have responded`;
}
