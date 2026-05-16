"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bed, Car, CheckCircle2, Clock3, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/domain/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type CabRecord, type DashboardSummary, type GuestRecord, type HotelRecord } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

export default function AnalyticsPage() {
  const { token, currentEventId, currentEvent, eventsLoaded, eventsLoading } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [cabs, setCabs] = useState<CabRecord[]>([]);
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!currentEventId) return;
    setLoaded(false);
    try {
      const [summaryResult, guestResult, cabResult, hotelResult] = await Promise.all([
        api.dashboardSummary(token, currentEventId),
        api.listGuests(token, currentEventId),
        api.listCabs(token, currentEventId),
        api.listHotels(token, currentEventId),
      ]);
      setSummary(summaryResult);
      setGuests(guestResult);
      setCabs(cabResult);
      setHotels(hotelResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load analytics");
    } finally {
      setLoaded(true);
    }
  }, [currentEventId, token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const metrics = useMemo(() => {
    const confirmed = guests.filter((guest) => guest.rsvpStatus === "CONFIRMED").length;
    const declined = guests.filter((guest) => guest.rsvpStatus === "DECLINED").length;
    const pending = guests.filter((guest) => guest.rsvpStatus === "PENDING").length;
    const checkedIn = guests.filter((guest) => guest.checkins?.length).length;
    const cabCapacity = cabs.reduce((sum, cab) => sum + cab.capacity, 0);
    const cabUsed = cabs.reduce((sum, cab) => sum + cab.usedSeats, 0);
    const rooms = hotels.flatMap((hotel) => hotel.rooms || []);
    const roomCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const roomUsed = rooms.reduce(
      (sum, room) => sum + (room.assignments || []).reduce((inner, assignment) => inner + assignment.assignedMembers, 0),
      0
    );

    return {
      confirmed,
      declined,
      pending,
      checkedIn,
      cabCapacity,
      cabUsed,
      roomCapacity,
      roomUsed,
      cabUtilization: cabCapacity ? Math.round((cabUsed / cabCapacity) * 100) : 0,
      roomOccupancy: roomCapacity ? Math.round((roomUsed / roomCapacity) * 100) : 0,
    };
  }, [cabs, guests, hotels]);

  const loading = !eventsLoaded || eventsLoading || !loaded;

  if (loading) return <AnalyticsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={`EVENTS / ${currentEvent?.name || "SELECTED EVENT"}`}
        title="Analytics"
        description="Event-level RSVP, attendance, and logistics insights."
        actions={
          <Button variant="outline" type="button" className="gap-2" onClick={load}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Guests" value={`${summary?.totalGuests || guests.length}`} subtext="Guest records" icon={Users} />
        <StatCard label="Confirmed RSVP" value={`${summary?.confirmed || metrics.confirmed}`} subtext={`${metrics.confirmed} accepted guests`} icon={CheckCircle2} />
        <StatCard label="Checked-in" value={`${summary?.checkedIn || metrics.checkedIn}`} subtext="Scanned guests" icon={Bed} />
        <StatCard label="Pending" value={`${metrics.pending}`} subtext="Awaiting RSVP" icon={Clock3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightCard
          title="RSVP Breakdown"
          rows={[
            { label: "Confirmed", value: metrics.confirmed, total: guests.length },
            { label: "Declined", value: metrics.declined, total: guests.length },
            { label: "Pending", value: metrics.pending, total: guests.length },
          ]}
        />
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle>Logistics Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Utilization
              label="Cab Utilization"
              value={metrics.cabUtilization}
              caption={metrics.cabUsed ? `${metrics.cabUsed}/${metrics.cabCapacity} seats filled` : "No cab assignments yet"}
              icon={Car}
              empty={!metrics.cabUsed}
            />
            <Utilization
              label="Room Occupancy"
              value={metrics.roomOccupancy}
              caption={metrics.roomUsed ? `${metrics.roomUsed}/${metrics.roomCapacity} members assigned` : "No rooms assigned yet"}
              icon={Bed}
              empty={!metrics.roomUsed}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; total: number }[];
}) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => {
          const percent = row.total ? Math.round((row.value / row.total) * 100) : 0;
          return (
            <div key={row.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{row.label} ({row.value})</span>
                <span className="text-muted-foreground">{row.value} · {percent}%</span>
              </div>
              <Progress value={percent} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function Utilization({
  label,
  value,
  caption,
  icon: Icon,
  empty,
}: {
  label: string;
  value: number;
  caption: string;
  icon: typeof Car;
  empty?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <Icon className="size-4 text-primary" />
          {label}
        </span>
        <span className="font-semibold text-primary">{empty ? "No data" : `${value}%`}</span>
      </div>
      {!empty && <Progress value={value} className="h-2" />}
      <p className="mt-2 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}
