"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Bed, Car, UserCheck, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/domain/stat-card";
import { ArrivalsTable } from "@/components/domain/dashboard/arrivals-table";
import { QuickActions } from "@/components/domain/dashboard/quick-actions";
import { arrivals } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type AuditRecord, type DashboardSummary } from "@/lib/api";
import { scopedEventHref } from "@/lib/design-tokens";
import { useApp } from "@/components/providers/app-provider";

export default function DashboardPage() {
  const { token, currentEventId, eventsLoaded, eventsLoading } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [feed, setFeed] = useState<AuditRecord[]>([]);
  const [error, setError] = useState(false);
  const loading = !eventsLoaded || eventsLoading || (Boolean(currentEventId) && !summary && !error);

  useEffect(() => {
    if (!currentEventId) return;
    Promise.all([
      api.dashboardSummary(token, currentEventId),
      api.dashboardFeed(token, currentEventId),
    ])
      .then(([summaryResult, feedResult]) => {
        setSummary(summaryResult);
        setFeed(feedResult);
        setError(false);
      })
      .catch((err) => {
        setError(true);
        toast.error(err instanceof Error ? err.message : "Could not load dashboard");
      });
  }, [currentEventId, token]);

  const checkInPercent = summary?.totalGuests
    ? Math.round((summary.checkedIn / summary.totalGuests) * 100)
    : 0;

  const feedItems = useMemo(
    () =>
      feed.slice(0, 3).map((item) => ({
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
              : ("guest" as const),
      })),
    [feed]
  );

  return loading ? (
    <DashboardSkeleton />
  ) : (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Check-in Progress"
          value={`${checkInPercent}%`}
          trend={`${summary?.checkedIn || 0}/${summary?.totalGuests || 0}`}
          icon={UserCheck}
          progress={checkInPercent}
        />
        <StatCard
          label="Pending Pickups"
          value={`${summary?.pendingPickups || 0} guests`}
          subtext="Confirmed guests without cab assignment"
          subtextClassName="text-status-warning"
          icon={Car}
        />
        <StatCard
          label="Confirmed"
          value={`${summary?.confirmed || 0}`}
          subtext="RSVP accepted"
          icon={Bed}
        />
        <StatCard
          label="Total Guests"
          value={`${summary?.totalGuests || 0}`}
          subtext="Guests in selected event"
          icon={Users}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Activity Preview
              </CardTitle>
              <Button
                render={<Link href={scopedEventHref(currentEventId, "/live")} />}
                nativeButton={false}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                View Live
                <ArrowRight className="size-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {feedItems.length ? (
                <ul className="space-y-3">
                  {feedItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 rounded-lg bg-surface-container-low p-3 text-sm">
                      <Activity className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block font-medium capitalize">{item.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{item.subtitle} · {item.time}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg bg-surface-container-low p-6 text-center text-sm text-muted-foreground">
                  No activity yet. Live operations will appear once guests start responding.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="self-start">
          <QuickActions />
        </div>
      </div>
      <ArrivalsTable arrivals={arrivals} />
      <Button
        size="icon"
        className="fixed bottom-8 right-8 size-14 rounded-full shadow-lg"
        type="button"
      >
        <Plus className="size-6" />
      </Button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="size-6 rounded-full" />
            </div>
            <Skeleton className="mt-6 h-1.5 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <Skeleton className="h-4 w-40" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-36" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="mt-5 h-16 w-full" />
        </div>
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
