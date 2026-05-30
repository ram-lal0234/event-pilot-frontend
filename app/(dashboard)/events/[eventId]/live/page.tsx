"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Car, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LiveCampaignCard } from "@/components/domain/dashboard/live-campaign-card";
import { LiveOperationsFeed } from "@/components/domain/dashboard/live-operations-feed";
import { PageHeader } from "@/components/domain/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventAccess } from "@/hooks/use-event-access";
import { api, type AuditRecord, type DashboardSummary } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

export default function LivePage() {
  const { token, currentEventId, currentEvent, eventsLoaded, eventsLoading } = useApp();
  const { canTriggerVoice } = useEventAccess();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [feed, setFeed] = useState<AuditRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!currentEventId) return;
    setLoaded(false);
    try {
      const [summaryResult, feedResult] = await Promise.all([
        api.dashboardSummary(token, currentEventId),
        api.dashboardFeed(token, currentEventId),
      ]);
      setSummary(summaryResult);
      setFeed(feedResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load live view");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEventId, token]);

  const loading = !eventsLoaded || eventsLoading || !loaded;
  const checkInPercent = summary?.totalGuests
    ? Math.round((summary.checkedIn / summary.totalGuests) * 100)
    : 0;

  const feedItems = useMemo(
    () =>
      feed.map((item) => ({
        id: item.id,
        title: item.action.replaceAll("_", " ").toLowerCase(),
        subtitle: `${item.entityType} ${item.entityId.slice(0, 8)}`,
        time: new Date(item.createdAt).toLocaleString(),
        type: item.action.includes("CHECK")
          ? ("checkin" as const)
          : item.action.includes("RSVP")
            ? ("rsvp" as const)
            : item.action.includes("CAB")
              ? ("cab" as const)
              : item.action.includes("ROOM")
                ? ("room" as const)
                : ("guest" as const),
      })),
    [feed],
  );

  if (loading) return <LiveSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={`EVENTS / ${currentEvent?.name || "SELECTED EVENT"}`}
        title="Live"
        description="Voice campaign progress, live call outcomes, and day-of operations in one place."
        actions={
          <Button variant="outline" type="button" className="gap-2" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      {currentEventId ? (
        <LiveCampaignCard
          token={token}
          eventId={currentEventId}
          eventName={currentEvent?.name || "Event"}
          summary={summary}
          canCallAll={canTriggerVoice}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Check-in progress"
          value={`${checkInPercent}%`}
          trend={`${summary?.checkedIn || 0} / ${summary?.totalGuests || 0} guests`}
          icon={CheckCircle2}
          progress={checkInPercent}
        />
        <StatCard
          label="Ops activity"
          value={`${feed.length}`}
          subtext="Recent audit events (refresh to update)"
          icon={Activity}
        />
        <StatCard
          label="Pending pickups"
          value={`${summary?.pendingPickups || 0}`}
          subtext="Confirmed guests without cab"
          icon={Car}
        />
      </div>

      <LiveOperationsFeed items={feedItems} />
    </div>
  );
}

function LiveSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl" />
    </div>
  );
}
