"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, LoaderCircle, MessageCircle, Play, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { DashboardSummary } from "@/lib/api";
import type { OutreachSummary } from "@/lib/outreach";
import { scopedEventHref } from "@/lib/design-tokens";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";

function StepIcon({ status }: { status: OutreachSummary["nextSteps"][number]["status"] }) {
  if (status === "done") {
    return <CheckCircle2 className="size-4 text-status-success" />;
  }
  if (status === "in_progress") {
    return <LoaderCircle className="size-4 animate-spin text-primary" />;
  }
  return <Circle className="size-4 text-muted-foreground" />;
}

export function OutreachGuideCard({
  eventId,
  summary,
  outreach,
  loading,
  onRefresh,
}: {
  eventId: string;
  summary: DashboardSummary | null;
  outreach: OutreachSummary | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const { token } = useApp();
  const { canWrite } = useEventAccess();
  const data = outreach;

  const startBatch = async () => {
    if (!token) return;
    try {
      const result = await api.startOutreachBatch(token, eventId);
      toast.success(`WhatsApp messages sent to ${result.queued ?? result.sent} guest${(result.queued ?? result.sent) === 1 ? "" : "s"}`);
      if (result.failed > 0) {
        toast.message(
          `${result.failed} guest${result.failed === 1 ? "" : "s"} couldn't be reached — check phone numbers and settings`,
        );
      }
      }
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start outreach");
    }
  };

  if (loading) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="mb-3 h-5 w-48" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-20 w-full" />
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageCircle className="size-4 text-primary" />
            WhatsApp-first RSVP outreach
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            WhatsApp link → auto voice call after {data.voiceDelayHours}h → reminder if call fails
          </p>
        </div>
        {data.enabled && canWrite ? (
          <Button type="button" size="sm" className="gap-2" onClick={() => void startBatch()}>
            <Play className="size-3.5" />
            Send invites now
          </Button>
        ) : null}
      </div>

      {data.enabled ? (
        <div className="grid gap-2 border-b border-border px-4 py-3 sm:grid-cols-4">
          <MiniStat label="Awaiting RSVP" value={data.counts.awaiting} />
          <MiniStat label="Calls placed" value={data.counts.voiceAttempted} />
          <MiniStat label="Needs you" value={data.counts.needsPlanner} />
          <MiniStat label="Complete" value={data.counts.complete} />
        </div>
      ) : null}

      <div className="space-y-3 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What to do next</p>
        {data.nextSteps.map((step: OutreachSummary["nextSteps"][number]) => (
          <div key={step.id} className="flex gap-3 rounded-md border border-border px-3 py-3">
            <StepIcon status={step.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{step.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
              {step.action === "open_event_settings" && canWrite ? (
                <Button
                  render={<Link href={scopedEventHref(eventId, "/events")} />}
                  nativeButton={false}
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto gap-1 px-0"
                >
                  <Settings className="size-3.5" />
                  Open event settings
                </Button>
              ) : null}
              {step.action === "start_outreach_batch" && canWrite ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto gap-1 px-0"
                  onClick={() => void startBatch()}
                >
                  <Play className="size-3.5" />
                  Start outreach
                </Button>
              ) : null}
              {step.action === "open_follow_up" ? (
                <Button
                  render={<Link href={scopedEventHref(eventId, "/follow-up")} />}
                  nativeButton={false}
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto gap-1 px-0"
                >
                  Open follow-up
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {!data.enabled ? (
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Pending RSVPs from dashboard: {summary?.pendingRsvp ?? data.pendingRsvp}. Enable outreach to automate WhatsApp → call → reminder.
        </p>
      ) : null}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-surface-container-low px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
