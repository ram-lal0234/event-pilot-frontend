"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, QrCode, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type CheckinLocationType, type GuestRecord } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

export default function CheckInPage() {
  const { token, eventsLoaded, eventsLoading } = useApp();
  const [qrCode, setQrCode] = useState("");
  const [locationType, setLocationType] = useState<CheckinLocationType>("EVENT_GATE");
  const [guest, setGuest] = useState<GuestRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(true);
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!scannerOpen) {
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
  }, [scannerOpen]);

  const scan = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.scanQr(token, { qrCode, method: "QR", locationType });
      setGuest(result.guest);
      toast.success("Check-in completed");
      setQrCode("");
      setScannerOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not check in guest");
    } finally {
      setBusy(false);
    }
  };

  if (!eventsLoaded || eventsLoading) {
    return <CheckInSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <form className="relative flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card" onSubmit={scan}>
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <QrCode className="size-5" />
              </div>
              <div>
                <h1 className="font-semibold">QR Check-In</h1>
                <p className="text-sm text-muted-foreground">Scan guest badges with the device camera.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-5 p-5 md:p-6">
            <div className="mx-auto grid w-full max-w-2xl gap-4">
              <div className="overflow-hidden rounded-xl border border-border bg-surface-container-low">
                <div className="flex flex-col gap-3 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Camera className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Scan Guest QR</p>
                      <p className="text-sm text-muted-foreground">Camera scan is active by default.</p>
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
                      className="min-h-[360px] overflow-hidden rounded-lg border border-dashed border-primary/30 bg-card"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 bg-background p-6 text-center">
                    <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-surface-container-low text-primary">
                      <Camera className="size-8" />
                    </div>
                    <div>
                      <p className="font-semibold">Scanner paused</p>
                      <p className="mt-1 text-sm text-muted-foreground">Start the camera again when the next guest is ready.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-3 rounded-xl border border-border bg-background p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Manual fallback</p>
                  <p className="mt-1 text-sm text-muted-foreground">Use this only when the camera cannot read the badge.</p>
                </div>
                <Input value={qrCode} onChange={(event) => setQrCode(event.target.value)} placeholder="guest:event-id:uuid" required />
                <Select
                  value={locationType}
                  onChange={(event) => setLocationType(event.target.value as CheckinLocationType)}
                >
                  <option value="EVENT_GATE">Event gate</option>
                  <option value="HOTEL">Hotel</option>
                </Select>
              </div>
              <Button
                className="h-10 gap-2"
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
        </form>
      </div>
      <div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">Guest Confirmation</h2>
          {guest ? (
            <div className="mt-5 space-y-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-status-success text-white">
                <QrCode className="size-6" />
              </div>
              <div>
                <p className="text-lg font-bold">{guest.name}</p>
                <p className="text-sm text-muted-foreground">{guest.email || guest.phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Category" value={guest.category} />
                <Info label="Group" value={String(guest.groupSize)} />
                <Info label="RSVP" value={guest.rsvpStatus} />
                <Info label="Location" value={locationType === "HOTEL" ? "Hotel" : "Event gate"} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No check-in scanned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckInSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="relative flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-5 p-6">
            <div className="mx-auto grid w-full max-w-2xl gap-4">
              <Skeleton className="h-[430px] w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-80 w-full rounded-lg" />
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
