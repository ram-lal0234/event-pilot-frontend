"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bed, Car, UserCheck, Users, Plus } from "lucide-react";
import { StatCard } from "@/components/domain/stat-card";
import { LiveOperationsFeed } from "@/components/domain/dashboard/live-operations-feed";
import { ArrivalsTable } from "@/components/domain/dashboard/arrivals-table";
import { arrivals } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { api, type AuditRecord, type DashboardSummary } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

export default function DashboardPage() {
  const { token, currentEventId } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [feed, setFeed] = useState<AuditRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentEventId) return;
    Promise.all([
      api.dashboardSummary(token, currentEventId),
      api.dashboardFeed(token, currentEventId),
    ])
      .then(([summaryResult, feedResult]) => {
        setSummary(summaryResult);
        setFeed(feedResult);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard"));
  }, [currentEventId, token]);

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
        type: item.action.includes("CHECKED") ? "checkin" as const : "cab" as const,
      })),
    [feed]
  );

  return (
    <div className="space-y-6">
      {error && <p className="rounded-md bg-status-error-bg p-3 text-sm text-status-error">{error}</p>}
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
          <LiveOperationsFeed items={feedItems} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-base font-semibold">Quick Actions</p>
          <div className="mt-4 grid gap-2">
            <QuickLink href="/guests">Add Guests</QuickLink>
            <QuickLink href="/check-in">Open Check-In</QuickLink>
            <QuickLink href="/operations">Assign Logistics</QuickLink>
          </div>
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

function QuickLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
    >
      {children}
    </a>
  );
}
