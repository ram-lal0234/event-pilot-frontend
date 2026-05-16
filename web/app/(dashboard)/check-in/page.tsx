"use client";

import { useState, type FormEvent } from "react";
import { QrCode, Search } from "lucide-react";
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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const scan = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api.scanQr(token, { qrCode, method: "QR", locationType });
      setGuest(result.guest);
      setMessage("Check-in completed");
      setQrCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check in guest");
    } finally {
      setBusy(false);
    }
  };

  if (!eventsLoaded || eventsLoading) {
    return <CheckInSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <form className="relative flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card" onSubmit={scan}>
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <QrCode className="size-5" />
              </div>
              <div>
                <h1 className="font-semibold">QR Check-In</h1>
                <p className="text-sm text-muted-foreground">Paste or scan the guest QR payload.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-5 p-6">
            <div className="mx-auto flex size-40 items-center justify-center rounded-xl border border-dashed border-primary/40 bg-surface-container-low">
              <QrCode className="size-20 text-primary" />
            </div>
            <div className="mx-auto grid w-full max-w-xl gap-3">
              <Input value={qrCode} onChange={(event) => setQrCode(event.target.value)} placeholder="guest:event-id:uuid" required />
              <Select
                value={locationType}
                onChange={(event) => setLocationType(event.target.value as CheckinLocationType)}
              >
                <option value="EVENT_GATE">Event gate</option>
                <option value="HOTEL">Hotel</option>
              </Select>
              <Button className="gap-2" type="submit" disabled={busy}>
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
          {message && <p className="mt-3 rounded-md bg-status-success-bg p-2 text-sm text-status-success">{message}</p>}
          {error && <p className="mt-3 rounded-md bg-status-error-bg p-2 text-sm text-status-error">{error}</p>}
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
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
            <Skeleton className="mx-auto size-40 rounded-xl" />
            <div className="mx-auto grid w-full max-w-xl gap-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
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
