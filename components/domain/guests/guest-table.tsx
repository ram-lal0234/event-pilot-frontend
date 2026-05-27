"use client";

import { useState, type FormEvent } from "react";
import { ChevronRight, Download, MapPin, Phone, QrCode, Radio } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import type { GuestRecord, RsvpStatus } from "@/lib/api";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function categoryVariant(category: GuestRecord["category"]) {
  switch (category) {
    case "VIP":
      return "vip" as const;
    default:
      return "attendee" as const;
  }
}

function GuestQrDialog({ guest }: { guest: GuestRecord }) {
  const qrCanvasId = `guest-qr-${guest.id}`;

  const downloadQr = () => {
    const canvas = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error("QR code is not ready yet");
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${guest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "guest"}-qr.png`;
    link.click();
    toast.success("QR code downloaded");
  };

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="gap-2" type="button" />}
      >
        <QrCode className="size-4" />
        Open QR Code
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{guest.name}</DialogTitle>
          <DialogDescription>
            Show this badge at the gate scanner or download it for printing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid justify-items-center gap-4 rounded-xl border border-border bg-surface-container-low p-5">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <QRCodeCanvas
              id={qrCanvasId}
              value={guest.qrCode}
              size={220}
              includeMargin
            />
          </div>
          <p className="max-w-full break-all text-center text-xs text-muted-foreground">
            {guest.qrCode}
          </p>
        </div>

        <DialogFooter>
          <Button className="gap-2" type="button" onClick={downloadQr}>
            <Download className="size-4" />
            Download QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GuestDetailsSheet({
  guest,
  onTriggerIvr,
  onUpdateRsvp,
}: {
  guest: GuestRecord;
  onTriggerIvr: (guestId: string) => void;
  onUpdateRsvp: (guestId: string, payload: { rsvpStatus: RsvpStatus; groupSize: number }) => Promise<string | null>;
}) {
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [groupSize, setGroupSize] = useState(guest.groupSize);
  const [savedRsvpStatus, setSavedRsvpStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [savedGroupSize, setSavedGroupSize] = useState(guest.groupSize);
  const [busy, setBusy] = useState(false);
  const [ivrBusy, setIvrBusy] = useState(false);
  const ivrDisabled = savedRsvpStatus !== "PENDING";

  const submitRsvp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const errorMessage = await onUpdateRsvp(guest.id, {
      rsvpStatus,
      groupSize: Number(groupSize),
    });
    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      setSavedRsvpStatus(rsvpStatus);
      setSavedGroupSize(Number(groupSize));
      toast.success("Manual RSVP saved");
    }
    setBusy(false);
  };

  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" type="button" aria-label={`View ${guest.name}`} />}
      >
        <ChevronRight className="size-4 text-muted-foreground" />
      </SheetTrigger>
      <SheetContent className="min-h-0 overflow-hidden sm:max-w-lg">
        <SheetHeader className="shrink-0">
          <SheetTitle>{guest.name}</SheetTitle>
          <SheetDescription>
            Guest profile, pickup details, IVR status, and check-in context.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-6">
          <section className="rounded-lg border border-border p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase text-muted-foreground">
              Contact Info
            </p>
            {guest.phone && (
              <p className="flex items-center gap-2 text-sm">
                <Phone className="size-4" />
                {guest.phone}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{guest.email || "No email"}</p>
          </section>

          <section className="rounded-lg border border-border p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase text-muted-foreground">
              Manual RSVP
            </p>
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto]" onSubmit={submitRsvp}>
              <Select
                value={rsvpStatus}
                onChange={(event) => setRsvpStatus(event.target.value as RsvpStatus)}
                aria-label="RSVP status"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="DECLINED">Declined</option>
              </Select>
              <Input
                type="number"
                min={1}
                max={100}
                value={groupSize}
                onChange={(event) => setGroupSize(Number(event.target.value))}
                aria-label="Group size"
              />
              <Button type="submit" loading={busy} loadingText="Saving RSVP">
                Save
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              Use this when the guest confirms directly with staff.
            </p>
          </section>

          <section className="rounded-lg border border-border p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase text-muted-foreground">
              Pickup
            </p>
            <p className="flex items-center gap-2 text-sm">
              <MapPin className="size-4" />
              {guest.pickupLocation || "Not provided"}
            </p>
            {guest.pickupLat && guest.pickupLng && (
              <p className="mt-1 text-sm text-muted-foreground">
                {guest.pickupLat}, {guest.pickupLng}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase text-muted-foreground">
              IVR and QR
            </p>
            <p className="text-sm text-muted-foreground">
              {ivrDisabled
                ? `IVR disabled because RSVP is ${savedRsvpStatus.toLowerCase()}.`
                : guest.ivrRespondedAt
                  ? `Responded ${new Date(guest.ivrRespondedAt).toLocaleString()}`
                  : "No IVR response yet"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              type="button"
              loading={ivrBusy}
              loadingText="Queueing IVR"
              disabled={ivrDisabled}
              onClick={async () => {
                if (ivrDisabled) return;
                setIvrBusy(true);
                await onTriggerIvr(guest.id);
                setIvrBusy(false);
              }}
            >
              <Radio className="size-4" />
              Trigger IVR
            </Button>
            <div className="mt-3">
              <GuestQrDialog guest={guest} />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Category</p>
              <p className="mt-1 font-semibold">{guest.category}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Group</p>
              <p className="mt-1 font-semibold">{savedGroupSize}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">RSVP</p>
              <p className="mt-1 font-semibold">{savedRsvpStatus}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Check-In</p>
              <p className="mt-1 font-semibold">
                {guest.checkins?.length ? "Checked-in" : "Pending"}
              </p>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function GuestTable({
  guests,
  onTriggerIvr,
  onUpdateRsvp,
}: {
  guests: GuestRecord[];
  onTriggerIvr: (guestId: string) => void;
  onUpdateRsvp: (guestId: string, payload: { rsvpStatus: RsvpStatus; groupSize: number }) => Promise<string | null>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Guest Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>RSVP</TableHead>
            <TableHead>Operations</TableHead>
            <TableHead>Check-In</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length ? guests.map((guest) => (
            <TableRow key={guest.id}>
              <TableCell>
                <Checkbox readOnly />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback>
                      {guest.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-text-main">{guest.name}</p>
                    <p className="text-xs text-muted-foreground">{guest.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge variant={categoryVariant(guest.category)}>
                  {guest.category}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className={`size-2 rounded-full ${
                      guest.rsvpStatus === "CONFIRMED"
                        ? "bg-status-success"
                        : "bg-status-warning"
                    }`}
                  />
                  {guest.rsvpStatus}
                </span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                Group {guest.groupSize} · {guest.pickupLocation || "No pickup"}
              </TableCell>
              <TableCell>
                <StatusBadge
                  variant={
                    guest.checkins?.length ? "success" : "neutral"
                  }
                >
                  {guest.checkins?.length ? "CHECKED-IN" : "PENDING"}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <GuestDetailsSheet
                  key={`${guest.id}-${guest.rsvpStatus}-${guest.groupSize}`}
                  guest={guest}
                  onTriggerIvr={onTriggerIvr}
                  onUpdateRsvp={onUpdateRsvp}
                />
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                No guests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
