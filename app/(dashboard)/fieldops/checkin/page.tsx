"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Camera, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type CheckinLocationType, type GuestRecord } from "@/lib/api";
import { formLimits } from "@/lib/form-limits";

export default function FieldOpsCheckinPage() {
  const { token, eventsLoaded, eventsLoading } = useApp();
  const [qrCode, setQrCode] = useState("");
  const [locationType, setLocationType] = useState<CheckinLocationType>("EVENT_GATE");
  const [guest, setGuest] = useState<GuestRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const scan = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.scanQr(token, {
        qrCode: qrCode.trim(),
        method: "MANUAL",
        locationType,
      });
      setGuest(result.guest);
      toast.success(result.alreadyCheckedIn ? "Already checked in" : "Checked in");
      setQrCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setBusy(false);
    }
  };

  if (!eventsLoaded || eventsLoading) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col gap-4 bg-background p-4 pb-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col gap-4 bg-background p-4 pb-8">
      <div>
        <h1 className="text-xl font-semibold">Field check-in</h1>
        <p className="text-sm text-muted-foreground">Paste or type guest QR code at the gate or hotel desk.</p>
      </div>

      <form className="space-y-3 rounded-xl border border-border bg-card p-4" onSubmit={scan}>
        <Select
          value={locationType}
          onValueChange={(value) => {
            if (value != null) setLocationType(value as CheckinLocationType);
          }}
        >
          <SelectTrigger className="w-full justify-between font-normal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="EVENT_GATE">Event gate</SelectItem>
            <SelectItem value="HOTEL">Hotel desk</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={qrCode}
          onChange={(event) => setQrCode(event.target.value)}
          placeholder="QR code value"
          required
          minLength={formLimits.qrCode.minLength}
          maxLength={formLimits.qrCode.maxLength}
          autoComplete="off"
        />
        <Button type="submit" className="w-full gap-2" loading={busy} loadingText="Checking in">
          <QrCode className="size-4" />
          Check in guest
        </Button>
      </form>

      {guest ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-lg font-bold">{guest.name}</p>
          <p className="text-sm text-muted-foreground">{guest.rsvpStatus} · Group {guest.groupSize}</p>
          {guest.checkins?.length ? (
            <ul className="mt-2 text-xs text-muted-foreground">
              {guest.checkins.map((c) => (
                <li key={c.id}>
                  {c.locationType === "HOTEL" ? "Hotel" : "Gate"}
                  {c.checkinTime ? ` · ${new Date(c.checkinTime).toLocaleTimeString()}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Button variant="outline" className="mt-auto w-full gap-2" render={<Link href="/check-in" />} nativeButton={false}>
        <Camera className="size-4" />
        Full scanner console
      </Button>
    </main>
  );
}
