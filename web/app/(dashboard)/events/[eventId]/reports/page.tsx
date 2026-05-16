"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileCheck2, FileSpreadsheet, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/domain/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type GuestRecord } from "@/lib/api";
import { downloadCsv, rowsToCsv } from "@/lib/csv";
import { useApp } from "@/components/providers/app-provider";

type ReportHistory = {
  name: string;
  date: string;
  rows: number;
};

export default function ReportsPage() {
  const { token, currentEventId, currentEvent, eventsLoaded, eventsLoading } = useApp();
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<ReportHistory[]>([]);

  const load = useCallback(async () => {
    if (!currentEventId) return;
    setLoaded(false);
    try {
      const guestResult = await api.listGuests(token, currentEventId);
      setGuests(guestResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load reports data");
    } finally {
      setLoaded(true);
    }
  }, [currentEventId, token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const summary = useMemo(() => {
    const confirmed = guests.filter((guest) => guest.rsvpStatus === "CONFIRMED").length;
    const declined = guests.filter((guest) => guest.rsvpStatus === "DECLINED").length;
    const pending = guests.filter((guest) => guest.rsvpStatus === "PENDING").length;
    const checkedIn = guests.filter((guest) => guest.checkins?.length).length;
    return { confirmed, declined, pending, checkedIn };
  }, [guests]);

  const safeEventName = (currentEvent?.name || "event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "event";

  const recordDownload = (name: string, rows: number) => {
    setHistory((items) => [
      { name, rows, date: new Date().toLocaleString() },
      ...items.slice(0, 4),
    ]);
  };

  const exportGuestList = () => {
    const csv = rowsToCsv(
      ["name", "phone", "email", "category", "group_size", "pickup_location", "rsvp_status", "checkin_status", "qr_code"],
      guests.map((guest) => [
        guest.name,
        guest.phone,
        guest.email || "",
        guest.category,
        guest.groupSize,
        guest.pickupLocation || "",
        guest.rsvpStatus,
        guest.checkins?.length ? "CHECKED_IN" : "PENDING",
        guest.qrCode,
      ])
    );
    downloadCsv(csv, `${safeEventName}-guest-list.csv`);
    recordDownload("Guest List", guests.length);
    toast.success("Guest list downloaded");
  };

  const exportCheckins = () => {
    const checkedInGuests = guests.filter((guest) => guest.checkins?.length);
    const csv = rowsToCsv(
      ["name", "phone", "email", "category", "group_size", "location_type", "method"],
      checkedInGuests.map((guest) => [
        guest.name,
        guest.phone,
        guest.email || "",
        guest.category,
        guest.groupSize,
        guest.checkins?.[0]?.locationType || "",
        guest.checkins?.[0]?.method || "",
      ])
    );
    downloadCsv(csv, `${safeEventName}-checkins.csv`);
    recordDownload("Check-in Data", checkedInGuests.length);
    toast.success("Check-in report downloaded");
  };

  const exportRsvpSummary = () => {
    const csv = rowsToCsv(
      ["metric", "value"],
      [
        ["total_guests", guests.length],
        ["confirmed", summary.confirmed],
        ["declined", summary.declined],
        ["pending", summary.pending],
        ["checked_in", summary.checkedIn],
      ]
    );
    downloadCsv(csv, `${safeEventName}-rsvp-summary.csv`);
    recordDownload("RSVP Summary", 5);
    toast.success("RSVP summary downloaded");
  };

  const loading = !eventsLoaded || eventsLoading || !loaded;

  if (loading) return <ReportsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={`EVENTS / ${currentEvent?.name || "SELECTED EVENT"}`}
        title="Reports"
        description="Export guest, check-in, and RSVP reports for the selected event."
        actions={
          <Button variant="outline" type="button" className="gap-2" onClick={load}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <ReportButton icon={Users} label="Export Guest List" caption={`${guests.length} guests`} onClick={exportGuestList} disabled={!guests.length} />
          <ReportButton icon={FileCheck2} label="Export Check-in Data" caption={`${summary.checkedIn} checked-in`} onClick={exportCheckins} disabled={!summary.checkedIn} />
          <ReportButton icon={FileSpreadsheet} label="Export RSVP Summary" caption={`${summary.confirmed} confirmed`} onClick={exportRsvpSummary} disabled={!guests.length} />
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle>Download History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Rows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length ? history.map((item) => (
                <TableRow key={`${item.name}-${item.date}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell className="text-right">{item.rows}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                    No reports downloaded in this session.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportButton({
  icon: Icon,
  label,
  caption,
  onClick,
  disabled,
}: {
  icon: typeof Users;
  label: string;
  caption: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      type="button"
      className="h-auto justify-between gap-4 p-4 text-left"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="size-5 shrink-0 text-primary" />
        <span className="min-w-0">
          <span className="block font-semibold">{label}</span>
          <span className="block text-xs font-normal text-muted-foreground">{caption}</span>
        </span>
      </span>
      <Download className="size-4 shrink-0" />
    </Button>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
