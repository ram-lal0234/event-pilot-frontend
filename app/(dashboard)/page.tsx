"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Phone,
  PhoneForwarded,
  QrCode,
  Radio,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { LiveCampaignTeaser } from "@/components/domain/dashboard/live-campaign-teaser";
import { OutreachGuideCard } from "@/components/domain/outreach/outreach-guide-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type AuditRecord, type DashboardSummary } from "@/lib/api";
import type { OutreachSummary } from "@/lib/outreach";
import { scopedEventHref } from "@/lib/design-tokens";
import { useApp } from "@/components/providers/app-provider";
import { userDisplayName } from "@/lib/user-display";

export default function DashboardPage() {
  const { token, currentEventId, currentEvent, eventsLoaded, eventsLoading, user, membership } =
    useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [outreach, setOutreach] = useState<OutreachSummary | null>(null);
  const [feed, setFeed] = useState<AuditRecord[]>([]);
  const [error, setError] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const loading = !eventsLoaded || eventsLoading || (Boolean(currentEventId) && !summary && !error);

  const loadOutreach = useCallback(async () => {
    if (!currentEventId || !token) return;
    setOutreachLoading(true);
    try {
      setOutreach(await api.outreachSummary(token, currentEventId));
    } catch {
      setOutreach(null);
    } finally {
      setOutreachLoading(false);
    }
  }, [currentEventId, token]);

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
    void loadOutreach();
  }, [currentEventId, token, loadOutreach]);

  const welcomeName = useMemo(
    () => userDisplayName(membership?.name, user.email),
    [membership?.name, user.email],
  );

  return loading ? (
    <DashboardSkeleton />
  ) : (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-foreground">
          Welcome, {welcomeName}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentEvent?.name || "Select an event"} — overview and shortcuts
        </p>
      </div>

      {currentEventId ? <LiveCampaignTeaser eventId={currentEventId} summary={summary} /> : null}

      {currentEventId ? (
        <OutreachGuideCard
          eventId={currentEventId}
          summary={summary}
          outreach={outreach}
          loading={outreachLoading}
          onRefresh={() => void loadOutreach()}
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total guests" value={`${summary?.totalGuests || 0}`} />
        <Metric label="Confirmed" value={`${summary?.confirmed || 0}`} />
        <Metric label="Declined" value={`${summary?.declined || 0}`} />
        <Metric label="Pending RSVP" value={`${summary?.pendingRsvp || 0}`} />
      </section>

      <section>
        <h2 className="mb-4 text-base font-bold text-foreground">Let&apos;s get you started</h2>
        <div className="grid gap-3 xl:grid-cols-3">
          <WorkflowPanel
            title="Guests & outreach"
            description="Import guests, call individuals, or start a bulk campaign from Live."
            actions={[
              { label: "Guests", caption: "Manage list, RSVP tabs, call all", icon: Users, href: "/guests" },
              {
                label: "Follow-up",
                caption: "Callbacks, no-answer, voicemail",
                icon: PhoneForwarded,
                href: "/follow-up",
              },
            ]}
          />
          <WorkflowPanel
            title="Event day"
            description="Check-in, pickups, and room assignments."
            actions={[
              { label: "Check-in", caption: "Scan QR at the gate or hotel", icon: QrCode, href: "/check-in" },
              { label: "Operations", caption: "Cabs, hotels, assignments", icon: Phone, href: "/operations" },
            ]}
          />
          <WorkflowPanel
            title="Monitor"
            description="Real-time voice campaign and operations feed."
            actions={[
              {
                label: "Live",
                caption: "Campaign progress, calls, check-ins",
                icon: Radio,
                href: "/live",
              },
              { label: "Reports", caption: "Export guest and RSVP data", icon: FileText, href: "/reports" },
            ]}
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <Button
            render={<Link href={scopedEventHref(currentEventId, "/live")} />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            Open Live
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="divide-y divide-border">
          {feed.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="flex size-8 items-center justify-center rounded-md bg-surface-container-low">
                <CheckCircle2 className="size-4 text-status-success" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium capitalize text-foreground">
                  {item.action.replaceAll("_", " ").toLowerCase()}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.entityType} {item.entityId.slice(0, 8)}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
          {!feed.length ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Activity will appear here once guests start responding. Full feed is on Live.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Needs follow-up</h2>
          <Button
            render={<Link href={scopedEventHref(currentEventId, "/follow-up")} />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <div className="space-y-2">
          {summary?.needsFollowUpGuests?.slice(0, 5).map((guest) => (
            <div
              key={guest.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{guest.name}</span>
                <span className="ml-2 text-muted-foreground">{guest.phone}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {guest.followUpStatus.replaceAll("_", " ")}
              </span>
            </div>
          ))}
          {!summary?.needsFollowUpGuests?.length ? (
            <p className="text-sm text-muted-foreground">No guests currently need follow-up.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function WorkflowPanel({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: Array<{
    label: string;
    caption: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
  }>;
}) {
  const { currentEventId } = useApp();

  return (
    <div className="rounded-lg bg-surface-container-low p-6">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={scopedEventHref(currentEventId, action.href)}
              className="flex min-h-16 items-center gap-3 rounded-lg border border-border bg-card px-3 transition-colors hover:bg-background"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{action.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{action.caption}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-52 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
