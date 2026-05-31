"use client";

import { useState, type FormEvent } from "react";
import { Bot, ChevronRight, Copy, Download, MapPin, Phone, QrCode, Radio } from "lucide-react";
import { GuestEditSheet } from "@/components/domain/guests/guest-edit-sheet";
import { GuestWhatsAppActions } from "@/components/domain/whatsapp/guest-whatsapp-actions";
import type { GuestFormState } from "@/lib/guest-form";
import type { GuestOpsFormState } from "@/components/domain/guests/guest-ops-fields";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { api, type GuestRecord, RsvpStatus } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { StatusBadge } from "@/components/domain/status-badge";
import { outreachStatusLabels, outreachStatusVariant } from "@/lib/outreach";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type VoiceCallMode = "ai" | "ivr";

function categoryVariant(category: GuestRecord["category"]) {
  switch (category) {
    case "VIP":
      return "vip" as const;
    default:
      return "attendee" as const;
  }
}

function rsvpVariant(status: RsvpStatus) {
  switch (status) {
    case "CONFIRMED":
      return "success" as const;
    case "DECLINED":
      return "error" as const;
    default:
      return "warning" as const;
  }
}

type GuestActionLayout = "compact" | "inline" | "stacked";

function GuestQrDialog({ guest, compact = false }: { guest: GuestRecord; compact?: boolean }) {
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

  const trigger = compact ? (
    <Button
      variant="ghost"
      size="icon-sm"
      type="button"
      aria-label={`QR code for ${guest.name}`}
    >
      <QrCode className="size-4" />
    </Button>
  ) : (
    <Button variant="outline" size="sm" className="gap-2" type="button">
      <QrCode className="size-4" />
      Open QR Code
    </Button>
  );

  const dialogTrigger = (
    <DialogTrigger render={trigger} />
  );

  return (
    <Dialog>
      {compact ? (
        <Tooltip>
          <TooltipTrigger render={dialogTrigger} />
          <TooltipContent>View QR code</TooltipContent>
        </Tooltip>
      ) : (
        dialogTrigger
      )}
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

const voiceCallConfirmCopy: Record<
  VoiceCallMode,
  { title: string; description: string; confirmLabel: string }
> = {
  ai: {
    title: "Start voice call?",
    description:
      "We will place a voice call to this guest now. Make sure they are available to answer.",
    confirmLabel: "Start call",
  },
  ivr: {
    title: "Start keypad call?",
    description:
      "We will place a keypad voice call where the guest can confirm or decline using number keys.",
    confirmLabel: "Start call",
  },
};

function GuestVoiceActionButtons({
  guestId,
  guestName,
  rsvpStatus,
  onTriggerVoiceCall,
  compact = false,
}: {
  guestId: string;
  guestName?: string;
  rsvpStatus: RsvpStatus;
  onTriggerVoiceCall: (guestId: string, callMode: VoiceCallMode) => Promise<string | null>;
  compact?: boolean;
}) {
  const { canTriggerVoice } = useEventAccess();
  const [confirmMode, setConfirmMode] = useState<VoiceCallMode | null>(null);
  const [voiceBusy, setVoiceBusy] = useState<VoiceCallMode | null>(null);
  const voiceDisabled = rsvpStatus !== "PENDING" || !canTriggerVoice;

  const triggerCall = async (mode: VoiceCallMode) => {
    if (voiceDisabled || voiceBusy) return;

    setVoiceBusy(mode);
    const errorMessage = await onTriggerVoiceCall(guestId, mode);
    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      toast.success("Call request sent");
    }
    setVoiceBusy(null);
    setConfirmMode(null);
  };

  const openConfirm = (mode: VoiceCallMode) => {
    if (voiceDisabled || voiceBusy) return;
    setConfirmMode(mode);
  };

  const confirmCopy = confirmMode ? voiceCallConfirmCopy[confirmMode] : null;

  const aiButton = (
    <Button
      variant={compact ? "ghost" : "default"}
      size={compact ? "icon-sm" : "sm"}
      className={compact ? undefined : "gap-2"}
      type="button"
      aria-label="Trigger AI call"
      disabled={voiceDisabled || voiceBusy !== null}
      onClick={() => openConfirm("ai")}
    >
      <Bot className="size-4" />
      {!compact ? "Trigger AI call" : null}
    </Button>
  );

  const ivrButton = (
    <Button
      variant="outline"
      size={compact ? "icon-sm" : "sm"}
      className={compact ? undefined : "gap-2"}
      type="button"
      aria-label="Trigger IVR"
      disabled={voiceDisabled || voiceBusy !== null}
      onClick={() => openConfirm("ivr")}
    >
      <Radio className="size-4" />
      {!compact ? "Trigger IVR" : null}
    </Button>
  );

  const confirmDialog = (
    <Dialog
      open={confirmMode !== null}
      onOpenChange={(open) => {
        if (!open && !voiceBusy) {
          setConfirmMode(null);
        }
      }}
    >
      <DialogContent showCloseButton={!voiceBusy}>
        {confirmCopy && confirmMode ? (
          <>
            <DialogHeader>
              <DialogTitle>{confirmCopy.title}</DialogTitle>
              <DialogDescription>
                {guestName ? (
                  <>
                    <span className="font-medium text-foreground">{guestName}</span>
                    {" — "}
                    {confirmCopy.description}
                  </>
                ) : (
                  confirmCopy.description
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={voiceBusy !== null}
                onClick={() => setConfirmMode(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={voiceBusy === confirmMode}
                loadingText="Queueing call"
                onClick={() => void triggerCall(confirmMode)}
              >
                {confirmCopy.confirmLabel}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  if (!compact) {
    return (
      <>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {aiButton}
          {ivrButton}
        </div>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger render={aiButton} />
        <TooltipContent>
          {voiceDisabled ? "RSVP must be pending" : "Trigger AI call"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={ivrButton} />
        <TooltipContent>
          {voiceDisabled ? "RSVP must be pending" : "Trigger IVR"}
        </TooltipContent>
      </Tooltip>
      {confirmDialog}
    </>
  );
}

function GuestRsvpLinkButton({
  guest,
  compact = false,
  layout = "inline",
}: {
  guest: GuestRecord;
  compact?: boolean;
  layout?: GuestActionLayout;
}) {
  const { token } = useApp();
  const [busy, setBusy] = useState(false);
  const stacked = layout === "stacked";

  const copyLink = async () => {
    setBusy(true);
    try {
      let url = guest.publicRsvpUrl;
      if (!url) {
        const link = await api.getGuestRsvpLink(token, guest.id);
        url = link.publicRsvpUrl;
      }
      await navigator.clipboard.writeText(url);
      toast.success("RSVP link copied");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not get RSVP link");
    } finally {
      setBusy(false);
    }
  };

  const trigger = (
    <Button
      variant={stacked || !compact ? "outline" : "ghost"}
      size={compact ? "icon-sm" : "sm"}
      type="button"
      className={stacked ? "w-full justify-center gap-2" : compact ? undefined : "gap-2"}
      onClick={() => void copyLink()}
      disabled={busy}
      loading={busy}
    >
      <Copy className="size-4" />
      {!compact ? "Copy RSVP link" : null}
    </Button>
  );

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger render={trigger} />
        <TooltipContent>Copy public RSVP link</TooltipContent>
      </Tooltip>
    );
  }

  return trigger;
}

function GuestTableQuickActions({
  guest,
  onTriggerVoiceCall,
  onUpdateGuest,
}: {
  guest: GuestRecord;
  onTriggerVoiceCall: (guestId: string, callMode: VoiceCallMode) => Promise<string | null>;
  onUpdateGuest: (guestId: string, form: GuestFormState, ops: GuestOpsFormState) => Promise<string | null>;
}) {
  const { canWrite } = useEventAccess();
  const { currentEvent } = useApp();

  return (
    <div className="flex items-center justify-end gap-0.5">
      <GuestRsvpLinkButton guest={guest} compact />
      {currentEvent ? <GuestWhatsAppActions guest={guest} event={currentEvent} compact /> : null}
      {canWrite ? <GuestEditSheet guest={guest} onSave={onUpdateGuest} compact /> : null}
      <GuestVoiceActionButtons
        guestId={guest.id}
        guestName={guest.name}
        rsvpStatus={guest.rsvpStatus}
        onTriggerVoiceCall={onTriggerVoiceCall}
        compact
      />
      <GuestQrDialog guest={guest} compact />
    </div>
  );
}

function GuestDetailsSheet({
  guest,
  onTriggerVoiceCall,
  onUpdateRsvp,
  onUpdateGuest,
}: {
  guest: GuestRecord;
  onTriggerVoiceCall: (guestId: string, callMode: VoiceCallMode) => Promise<string | null>;
  onUpdateRsvp: (guestId: string, payload: { rsvpStatus: RsvpStatus; groupSize: number }) => Promise<string | null>;
  onUpdateGuest: (guestId: string, form: GuestFormState, ops: GuestOpsFormState) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [groupSize, setGroupSize] = useState(guest.groupSize);
  const [savedRsvpStatus, setSavedRsvpStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [savedGroupSize, setSavedGroupSize] = useState(guest.groupSize);
  const [busy, setBusy] = useState(false);
  const { canWrite, canTriggerVoice } = useEventAccess();
  const { currentEvent } = useApp();
  const voiceDisabled = savedRsvpStatus !== "PENDING" || !canTriggerVoice;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon-sm" type="button" aria-label={`View ${guest.name}`} />}
      >
        <ChevronRight className="size-4 text-muted-foreground" />
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="pr-2 text-lg">{guest.name}</SheetTitle>
          <SheetDescription>
            Guest profile, pickup, voice outreach, and check-in.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Contact
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <GuestRsvpLinkButton guest={guest} layout="stacked" />
              {currentEvent ? (
                <GuestWhatsAppActions guest={guest} event={currentEvent} stacked />
              ) : null}
              {canWrite ? (
                <GuestEditSheet guest={guest} onSave={onUpdateGuest} stacked />
              ) : null}
            </div>
            {guest.publicRsvpUrl ? (
              <div className="mt-3 rounded-md border border-border bg-surface-container-low px-3 py-2">
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Public RSVP link
                </p>
                <p className="mt-1 line-clamp-2 font-mono text-xs text-foreground" title={guest.publicRsvpUrl}>
                  {guest.publicRsvpUrl}
                </p>
              </div>
            ) : null}
            <dl className="mt-4 space-y-2 text-sm">
              {guest.phone ? (
                <div className="flex gap-2">
                  <dt className="sr-only">Phone</dt>
                  <dd className="flex items-center gap-2 text-foreground">
                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                    {guest.phone}
                  </dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="sr-only">Email</dt>
                <dd className="text-muted-foreground">{guest.email || "No email"}</dd>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge variant={categoryVariant(guest.category)}>{guest.category}</StatusBadge>
                <span className="text-xs text-muted-foreground">Group {guest.groupSize}</span>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Manual RSVP
            </p>
            <form
              className="mt-3 flex flex-col gap-3"
              onSubmit={canWrite ? submitRsvp : (e) => e.preventDefault()}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  value={rsvpStatus}
                  disabled={!canWrite}
                  onValueChange={(status) => {
                    if (status != null) setRsvpStatus(status as RsvpStatus);
                  }}
                >
                  <SelectTrigger className="w-full justify-between font-normal">
                    <SelectValue placeholder="RSVP status" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="DECLINED">Declined</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={groupSize}
                  disabled={!canWrite}
                  onChange={(event) => setGroupSize(Number(event.target.value))}
                  aria-label="Group size"
                  placeholder="Group size"
                />
              </div>
              <Button
                type="submit"
                className="min-h-11 w-full sm:w-auto sm:self-start"
                loading={busy}
                loadingText="Saving RSVP"
                disabled={!canWrite}
              >
                Save RSVP
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              {canWrite
                ? "Use when the guest confirms directly with your team."
                : "Read-only — you cannot edit RSVP here."}
            </p>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Pickup
            </p>
            <p className="mt-3 flex items-start gap-2 text-sm text-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              {guest.pickupLocation || "Not provided"}
            </p>
            {guest.pickupLat && guest.pickupLng ? (
              <p className="mt-1 pl-6 text-xs text-muted-foreground">
                {guest.pickupLat}, {guest.pickupLng}
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Voice outreach
            </p>
            {voiceDisabled ? (
              <p className="mt-3 rounded-md border border-dashed border-border bg-surface-container-low px-3 py-2 text-sm text-muted-foreground">
                Outbound calls are only available while RSVP is{" "}
                <span className="font-medium text-foreground">Pending</span>. Change RSVP above to
                call this guest.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {guest.ivrRespondedAt
                    ? `Last voice response ${new Date(guest.ivrRespondedAt).toLocaleString()}`
                    : "No voice response yet."}
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <GuestVoiceActionButtons
                    guestId={guest.id}
                    guestName={guest.name}
                    rsvpStatus={savedRsvpStatus}
                    onTriggerVoiceCall={onTriggerVoiceCall}
                  />
                </div>
              </>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Check-in QR
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Gate scan code for this guest — available regardless of RSVP status.
            </p>
            <div className="mt-3">
              <GuestQrDialog guest={guest} />
            </div>
          </section>
        </SheetBody>

        <SheetFooter className="grid grid-cols-2 gap-2 border-t border-border bg-surface-container-low/50 p-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              RSVP
            </p>
            <div className="mt-2">
              <StatusBadge variant={rsvpVariant(savedRsvpStatus)}>{savedRsvpStatus}</StatusBadge>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Check-in
            </p>
            {guest.checkins?.length ? (
              <ul className="mt-2 space-y-0.5 text-xs font-medium text-foreground">
                {guest.checkins.map((checkin) => (
                  <li key={checkin.id}>
                    {checkin.locationType === "HOTEL" ? "Hotel" : "Gate"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm font-medium text-muted-foreground">Pending</p>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function GuestTable({
  guests,
  onTriggerVoiceCall,
  onUpdateRsvp,
  onUpdateGuest,
}: {
  guests: GuestRecord[];
  onTriggerVoiceCall: (guestId: string, callMode: VoiceCallMode) => Promise<string | null>;
  onUpdateRsvp: (guestId: string, payload: { rsvpStatus: RsvpStatus; groupSize: number }) => Promise<string | null>;
  onUpdateGuest: (guestId: string, form: GuestFormState, ops: GuestOpsFormState) => Promise<string | null>;
}) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[920px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Guest Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>RSVP</TableHead>
            <TableHead>Operations</TableHead>
            <TableHead>Check-In</TableHead>
            <TableHead className="w-[11rem] text-right">Quick actions</TableHead>
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
                {guest.outreachStatus && guest.outreachStatus !== "IDLE" ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span className="mt-1 inline-flex">
                          <StatusBadge variant={outreachStatusVariant(guest.outreachStatus)}>
                            {outreachStatusLabels[guest.outreachStatus]}
                          </StatusBadge>
                        </span>
                      }
                    />
                    <TooltipContent>
                      {guest.whatsappInitialSentAt
                        ? `WhatsApp: ${new Date(guest.whatsappInitialSentAt).toLocaleString()}`
                        : "Outreach"}
                      {guest.voiceAutoScheduledAt
                        ? ` · Call scheduled: ${new Date(guest.voiceAutoScheduledAt).toLocaleString()}`
                        : ""}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </TableCell>
              <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                <p className="truncate">Group {guest.groupSize} · {guest.pickupLocation || "No pickup"}</p>
                <p className="mt-1 truncate text-xs">
                  {guest.needsCab === true ? "Cab " : ""}
                  {guest.needsHotel === true ? "Hotel " : ""}
                  {guest.followUpStatus && guest.followUpStatus !== "NONE"
                    ? guest.followUpStatus.replaceAll("_", " ").toLowerCase()
                    : ""}
                </p>
              </TableCell>
              <TableCell>
                <StatusBadge
                  variant={
                    guest.checkins?.length ? "success" : "neutral"
                  }
                >
                  {guest.checkins?.length
                    ? `${guest.checkins.length} check-in${guest.checkins.length > 1 ? "s" : ""}`
                    : "PENDING"}
                </StatusBadge>
                {guest.checkins?.length ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {guest.checkins
                      .map((c) => (c.locationType === "HOTEL" ? "Hotel" : "Gate"))
                      .join(", ")}
                  </p>
                ) : null}
              </TableCell>
              <TableCell className="text-right">
                <GuestTableQuickActions
                  guest={guest}
                  onTriggerVoiceCall={onTriggerVoiceCall}
                  onUpdateGuest={onUpdateGuest}
                />
              </TableCell>
              <TableCell>
                <GuestDetailsSheet
                  key={`${guest.id}-${guest.rsvpStatus}-${guest.groupSize}`}
                  guest={guest}
                  onTriggerVoiceCall={onTriggerVoiceCall}
                  onUpdateRsvp={onUpdateRsvp}
                  onUpdateGuest={onUpdateGuest}
                />
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                No guests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
