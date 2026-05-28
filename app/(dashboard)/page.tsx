"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileText,
  Phone,
  QrCode,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type AuditRecord, type DashboardSummary } from "@/lib/api";
import { scopedEventHref } from "@/lib/design-tokens";
import { useApp } from "@/components/providers/app-provider";

export default function DashboardPage() {
  const { token, currentEventId, currentEvent, eventsLoaded, eventsLoading, user } = useApp();
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

  const firstName = useMemo(() => {
    const name = user.email.split("@")[0] || "there";
    return name.split(/[._-]/)[0] || name;
  }, [user.email]);

  return loading ? (
    <DashboardSkeleton />
  ) : (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-foreground">
          Welcome {firstName[0]?.toUpperCase()}{firstName.slice(1)}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentEvent?.name || "Select an event"} operations console
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-base font-bold text-foreground">Let&apos;s get you started</h2>
        <div className="grid gap-3 xl:grid-cols-3">
          <WorkflowPanel
            title="Build your guest list"
            description="Import guests and prepare RSVP outreach."
            actions={[
              { label: "Guests", caption: "Create and manage invitees", icon: Users, href: "/guests" },
              { label: "AI Voice Calls", caption: "Queue conversational RSVP calls", icon: Bot, href: "/guests" },
            ]}
          />
          <WorkflowPanel
            title="Deploy event operations"
            description="Set up check-in and logistics workflows."
            actions={[
              { label: "Check-In Mode", caption: "Scan QR codes at entry", icon: QrCode, href: "/check-in" },
              { label: "Operations", caption: "Manage pickup and accommodation", icon: Phone, href: "/operations" },
            ]}
          />
          <WorkflowPanel
            title="Monitor performance"
            description="Track responses and operational activity."
            actions={[
              { label: "Live View", caption: "Watch guest activity in real time", icon: BarChart3, href: "/live" },
              { label: "Reports", caption: "Export guest and RSVP reports", icon: FileText, href: "/reports" },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Metric label="Total Guests" value={`${summary?.totalGuests || 0}`} />
        <Metric label="Confirmed RSVP" value={`${summary?.confirmed || 0}`} />
        <Metric label="Declined RSVP" value={`${summary?.declined || 0}`} />
        <Metric label="Pending RSVP" value={`${summary?.pendingRsvp || 0}`} />
        <Metric label="Checked In" value={`${summary?.checkedIn || 0}`} />
        <Metric label="Pending Pickups" value={`${summary?.pendingPickups || 0}`} />
        <Metric label="Needs Follow-up" value={`${summary?.needsFollowUp || 0}`} />
        <Metric label="No Answer/VM" value={`${(summary?.noAnswer || 0) + (summary?.voicemail || 0)}`} />
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
            View all
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
              <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {!feed.length ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Activity will appear here once guests start responding.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Needs Follow-up</h2>
        <div className="mt-3 space-y-2">
          {summary?.needsFollowUpGuests?.map((guest) => (
            <div key={guest.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{guest.name}</span>
                <span className="ml-2 text-muted-foreground">{guest.phone}</span>
              </span>
              <span className="text-xs text-muted-foreground">{guest.followUpStatus.replaceAll("_", " ")}</span>
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
      <div className="grid gap-3 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-60 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
