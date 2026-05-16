"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Car, CheckCircle2, RefreshCw, Users } from "lucide-react";
import { PageHeader } from "@/components/domain/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { LiveOperationsFeed } from "@/components/domain/dashboard/live-operations-feed";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type AuditRecord, type DashboardSummary } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

export default function LiveViewPage() {
  const { token, currentEventId, currentEvent, eventsLoaded, eventsLoading } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [feed, setFeed] = useState<AuditRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

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
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load live view");
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
        type: item.action.includes("CHECK") ? ("checkin" as const) : ("cab" as const),
      })),
    [feed]
  );

  if (loading) return <LiveSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={`EVENTS / ${currentEvent?.name || "SELECTED EVENT"}`}
        title="Live View"
        description="Real-time event activity, check-ins, operations updates, and alerts."
        actions={
          <Button variant="outline" type="button" className="gap-2" onClick={load}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />
      {error && <p className="rounded-md bg-status-error-bg p-3 text-sm text-status-error">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live Activity" value={`${feed.length}`} subtext="Recent actions" icon={Activity} />
        <StatCard label="Check-in Progress" value={`${checkInPercent}%`} trend={`${summary?.checkedIn || 0}/${summary?.totalGuests || 0}`} icon={CheckCircle2} progress={checkInPercent} />
        <StatCard label="Pending Pickups" value={`${summary?.pendingPickups || 0}`} subtext="Confirmed without cab" icon={Car} />
        <StatCard label="Total Guests" value={`${summary?.totalGuests || 0}`} subtext="Guests in event" icon={Users} />
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
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl" />
    </div>
  );
}
