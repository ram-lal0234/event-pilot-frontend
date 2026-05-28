"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, MapPin, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type CheckinLocationType, type GuestRecord } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";

const SCAN_COOLDOWN_MS = 2500;

export default function CheckInPage() {
  const { token, currentEvent, eventsLoaded, eventsLoading } = useApp();
  const { canWrite } = useEventAccess();
  const [locationType, setLocationType] = useState<CheckinLocationType>("EVENT_GATE");
  const [guest, setGuest] = useState<GuestRecord | null>(null);
  const [recent, setRecent] = useState<Array<{ guest: GuestRecord; at: string; location: CheckinLocationType }>>([]);
  const [busy, setBusy] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [lastCheckedQr, setLastCheckedQr] = useState<string | null>(null);
  const [lastLocationType, setLastLocationType] = useState<CheckinLocationType | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const busyRef = useRef(false);
  const lastScanRef = useRef("");
  const lastScanAtRef = useRef(0);

  const performCheckIn = useCallback(
    async (qrCode: string) => {
      if (!canWrite) {
        toast.error("Read-only access — you cannot check in guests");
        return;
      }
      if (busyRef.current) return;

      const trimmed = qrCode.trim();
      if (!trimmed) return;

      busyRef.current = true;
      setBusy(true);
      try {
        const result = await api.scanQr(token, {
          qrCode: trimmed,
          method: "QR",
          locationType,
        });
        setGuest(result.guest);
        setLastCheckedQr(trimmed);
        setLastLocationType(locationType);
        setRecent((prev) => [
          { guest: result.guest, at: new Date().toISOString(), location: locationType },
          ...prev.filter((item) => item.guest.id !== result.guest.id).slice(0, 11),
        ]);
        toast.success(result.alreadyCheckedIn ? "Guest already checked in" : "Check-in completed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not check in guest");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [canWrite, locationType, token],
  );

  const onQrDecoded = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      if (decodedText === lastScanRef.current && now - lastScanAtRef.current < SCAN_COOLDOWN_MS) {
        return;
      }
      lastScanRef.current = decodedText;
      lastScanAtRef.current = now;
      void performCheckIn(decodedText);
    },
    [performCheckIn],
  );

  useEffect(() => {
    if (!eventsLoaded || eventsLoading) return undefined;

    let cancelled = false;
    setScannerReady(false);

    void import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;

      const reader = new Html5Qrcode("qr-reader");
      scannerRef.current = reader;

      try {
        await reader.start(
          { facingMode: "environment" },
          {
            fps: 10,
            aspectRatio: 1,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const edge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(edge * 0.72);
              return { width: size, height: size };
            },
          },
          onQrDecoded,
          () => undefined,
        );
        if (!cancelled) setScannerReady(true);
      } catch {
        toast.error("Could not start camera — allow camera access and reload");
      }
    });

    return () => {
      cancelled = true;
      const reader = scannerRef.current;
      scannerRef.current = null;
      if (reader) {
        void reader
          .stop()
          .catch(() => undefined)
          .finally(() => {
            try {
              reader.clear();
            } catch {
              /* ignore */
            }
          });
      }
    };
  }, [eventsLoaded, eventsLoading, onQrDecoded]);

  const undoLastCheckin = async () => {
    if (!lastCheckedQr) return;
    if (!canWrite) {
      toast.error("Read-only access — you cannot undo check-in");
      return;
    }
    setBusy(true);
    try {
      await api.undoCheckin(token, {
        qrCode: lastCheckedQr,
        locationType: lastLocationType || locationType,
      });
      toast.success("Last check-in undone");
      setGuest(null);
      setRecent((prev) => prev.slice(1));
      lastScanRef.current = "";
      lastScanAtRef.current = 0;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not undo check-in");
    } finally {
      setBusy(false);
    }
  };

  if (!eventsLoaded || eventsLoading) {
    return <CheckInSkeleton />;
  }

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] flex-col gap-3 overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <QrCode className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold md:text-lg">Check-In</h1>
            <p className="text-sm text-muted-foreground">Point the camera at a guest QR — check-in runs automatically.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-7 px-2 text-xs">
            {currentEvent?.name || "No event selected"}
          </Badge>
          <Select
            className="h-8 w-[140px] text-xs"
            value={locationType}
            onChange={(event) => setLocationType(event.target.value as CheckinLocationType)}
          >
            <option value="EVENT_GATE">Event gate</option>
            <option value="HOTEL">Hotel</option>
          </Select>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="shrink-0 border-b border-border px-4 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              {scannerReady ? (busy ? "Processing check-in…" : "Scanner active") : "Starting camera…"}
            </p>
          </div>
          <div className="relative min-h-0 flex-1 bg-background p-2">
            <div id="qr-reader" className="h-full min-h-[240px] w-full [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover" />
            {!scannerReady ? (
              <div className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-lg bg-background/80">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ) : null}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <div className="shrink-0 rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">Guest</h2>
            {guest ? (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-lg font-bold">{guest.name}</p>
                  <p className="text-sm text-muted-foreground">{guest.email || guest.phone}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Info label="Category" value={guest.category} />
                  <Info label="Group" value={String(guest.groupSize)} />
                  <Info label="RSVP" value={guest.rsvpStatus} />
                  <Info label="Location" value={locationType === "HOTEL" ? "Hotel" : "Event gate"} />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void undoLastCheckin()}
                  disabled={!lastCheckedQr || busy}
                >
                  Undo check-in
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Scan a QR code to see guest details here.</p>
            )}
          </div>

          <div className="min-h-0 flex-1 rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">Recent</h2>
            <div className="mt-2 space-y-2">
              {recent.map((item) => (
                <div key={`${item.guest.id}-${item.at}`} className="rounded-lg border border-border p-2.5">
                  <p className="text-sm font-medium">{item.guest.name}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    {new Date(item.at).toLocaleTimeString()}
                    <span>·</span>
                    <MapPin className="size-3.5" />
                    {item.location === "HOTEL" ? "Hotel" : "Gate"}
                  </p>
                </div>
              ))}
              {!recent.length ? (
                <p className="text-sm text-muted-foreground">No check-ins this session yet.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CheckInSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col gap-3 overflow-hidden">
      <Skeleton className="h-[4.5rem] shrink-0 rounded-xl" />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Skeleton className="min-h-0 flex-1 rounded-xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="min-h-0 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-2.5">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-primary">{value}</p>
    </div>
  );
}
