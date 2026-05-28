"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, Clock3, MapPin, QrCode, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type CheckinLocationType, type GuestRecord } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

type CheckinMode = "scanner" | "manual";

export default function CheckInPage() {
  const { token, currentEvent, eventsLoaded, eventsLoading } = useApp();
  const [mode, setMode] = useState<CheckinMode>("scanner");
  const [qrCode, setQrCode] = useState("");
  const [locationType, setLocationType] = useState<CheckinLocationType>("EVENT_GATE");
  const [guest, setGuest] = useState<GuestRecord | null>(null);
  const [recent, setRecent] = useState<Array<{ guest: GuestRecord; at: string; location: CheckinLocationType }>>([]);
  const [busy, setBusy] = useState(false);
  const [lastCheckedQr, setLastCheckedQr] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(true);
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!scannerOpen || mode !== "scanner") {
      return undefined;
    }

    void import("html5-qrcode").then(({ Html5QrcodeScanner, Html5QrcodeScanType }) => {
      if (cancelled) return;

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        },
        false
      );

      scannerRef.current = scanner;
      scanner.render(
        (decodedText) => {
          setQrCode(decodedText);
          toast.success("QR code scanned");
          setScannerOpen(false);
          void scanner.clear().catch(() => undefined);
        },
        () => undefined
      );
    }).catch(() => {
      toast.error("Could not start QR scanner");
      setScannerOpen(false);
    });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        void scannerRef.current.clear().catch(() => undefined);
        scannerRef.current = null;
      }
    };
  }, [mode, scannerOpen]);

  const scan = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.scanQr(token, { qrCode, method: mode === "manual" ? "MANUAL" : "QR", locationType });
      setGuest(result.guest);
      setLastCheckedQr(qrCode);
      setRecent((prev) => [
        { guest: result.guest, at: new Date().toISOString(), location: locationType },
        ...prev.filter((item) => item.guest.id !== result.guest.id).slice(0, 11),
      ]);
      toast.success(result.alreadyCheckedIn ? "Guest already checked in" : "Check-in completed");
      setQrCode("");
      if (mode === "scanner") {
        setScannerOpen(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not check in guest");
    } finally {
      setBusy(false);
    }
  };

  const undoLastCheckin = async () => {
    if (!lastCheckedQr) return;
    setBusy(true);
    try {
      await api.undoCheckin(token, { qrCode: lastCheckedQr });
      toast.success("Last check-in undone");
      setGuest(null);
      setRecent((prev) => prev.slice(1));
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
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrCode className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold md:text-lg">Check-In Console</h1>
              <p className="text-sm text-muted-foreground">
                Fast QR scan and manual fallback for gate and hotel desks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-6 px-2 text-xs">
              {currentEvent?.name || "No event selected"}
            </Badge>
            <Badge variant="outline" className="h-6 px-2 text-xs">
              {locationType === "HOTEL" ? "Hotel desk" : "Event gate"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
        <form
          className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card"
          onSubmit={scan}
        >
          <Tabs
            value={mode}
            onValueChange={(value) => {
              const nextMode = value as CheckinMode;
              setMode(nextMode);
              setScannerOpen(nextMode === "scanner");
            }}
            className="gap-0"
          >
            <div className="border-b border-border px-4 py-3 md:px-5">
              <TabsList variant="line" className="h-9 w-full justify-start sm:w-auto">
                <TabsTrigger value="scanner" className="gap-1.5">
                  <Camera className="size-4" />
                  Scanner
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-1.5">
                  <Search className="size-4" />
                  Manual
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="scanner" className="mt-0 flex-1 p-4 md:p-5">
              <div className="overflow-hidden rounded-xl border border-border bg-surface-container-low">
                <div className="flex flex-col gap-3 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Camera className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Scan Guest QR</p>
                      <p className="text-sm text-muted-foreground">Hold camera steady and align QR within frame.</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 sm:w-auto"
                    type="button"
                    onClick={() => setScannerOpen((value) => !value)}
                  >
                    {scannerOpen ? <X className="size-4" /> : <Camera className="size-4" />}
                    {scannerOpen ? "Pause Scanner" : "Start Scanner"}
                  </Button>
                </div>
                {scannerOpen ? (
                  <div className="bg-background p-3">
                    <div
                      id="qr-reader"
                      className="min-h-[280px] overflow-hidden rounded-lg border border-dashed border-primary/30 bg-card md:min-h-[360px]"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 bg-background p-6 text-center md:min-h-[360px]">
                    <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-surface-container-low text-primary">
                      <Camera className="size-8" />
                    </div>
                    <div>
                      <p className="font-semibold">Scanner paused</p>
                      <p className="mt-1 text-sm text-muted-foreground">Resume camera when the next guest is ready.</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-0 flex-1 p-4 md:p-5">
              <div className="grid h-full gap-4 rounded-xl border border-border bg-background p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Manual fallback</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use this when camera cannot read badge or staff receives code verbally.
                  </p>
                </div>
                <Input
                  value={qrCode}
                  onChange={(event) => setQrCode(event.target.value)}
                  placeholder="guest:event-id:uuid"
                  required
                />
                <Select
                  value={locationType}
                  onChange={(event) => setLocationType(event.target.value as CheckinLocationType)}
                >
                  <option value="EVENT_GATE">Event gate</option>
                  <option value="HOTEL">Hotel</option>
                </Select>
                <div className="mt-auto">
                  <Button
                    className="h-10 w-full gap-2"
                    type="submit"
                    loading={busy}
                    loadingText="Checking in"
                    disabled={!qrCode.trim()}
                  >
                    <Search className="size-4" />
                    Validate and Check In
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h2 className="font-semibold">Guest Confirmation</h2>
            {guest ? (
              <div className="mt-4 space-y-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-status-success text-white">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-bold">{guest.name}</p>
                  <p className="text-sm text-muted-foreground">{guest.email || guest.phone}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm sm:gap-3">
                  <Info label="Category" value={guest.category} />
                  <Info label="Group" value={String(guest.groupSize)} />
                  <Info label="RSVP" value={guest.rsvpStatus} />
                  <Info label="Location" value={locationType === "HOTEL" ? "Hotel" : "Event gate"} />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={undoLastCheckin} disabled={!lastCheckedQr || busy}>
                  Undo check-in
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No guest checked in yet. Start scanner or switch to manual mode.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h2 className="font-semibold">Recent Check-Ins</h2>
            <div className="mt-3 space-y-2">
              {recent.map((item) => (
                <div key={item.guest.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{item.guest.name}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    {new Date(item.at).toLocaleTimeString()}
                    <span className="mx-1">•</span>
                    <MapPin className="size-3.5" />
                    {item.location === "HOTEL" ? "Hotel" : "Event gate"}
                  </p>
                </div>
              ))}
              {!recent.length ? (
                <p className="text-sm text-muted-foreground">No check-ins in this session yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckInSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
        <div className="overflow-hidden rounded-xl border border-border bg-card p-4 md:p-5">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="mt-4 h-[360px] w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-primary">{value}</p>
    </div>
  );
}
