"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Bot, ChevronRight, Clock3, Download, FileAudio, MapPin, MessageSquareText, Phone, QrCode, Radio, RefreshCw } from "lucide-react";
import { GuestEditSheet } from "@/components/domain/guests/guest-edit-sheet";
import type { GuestFormState } from "@/lib/guest-form";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import type { GuestCallLogEntry, GuestCallLogs, GuestRecord, RsvpStatus } from "@/lib/api";
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
    title: "Start AI voice call?",
    description:
      "Plivo will call this guest and run the conversational RSVP agent. The guest must be able to answer now.",
    confirmLabel: "Start AI call",
  },
  ivr: {
    title: "Start IVR call?",
    description:
      "Plivo will call this guest and play the keypad IVR (press 1 to confirm, 2 to decline).",
    confirmLabel: "Start IVR call",
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
  const [confirmMode, setConfirmMode] = useState<VoiceCallMode | null>(null);
  const [voiceBusy, setVoiceBusy] = useState<VoiceCallMode | null>(null);
  const voiceDisabled = rsvpStatus !== "PENDING";

  const triggerCall = async (mode: VoiceCallMode) => {
    if (voiceDisabled || voiceBusy) return;

    setVoiceBusy(mode);
    const errorMessage = await onTriggerVoiceCall(guestId, mode);
    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      toast.success(mode === "ai" ? "AI voice call queued" : "IVR call queued");
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
        <div className="flex flex-wrap gap-2">
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

function GuestTableQuickActions({
  guest,
  onTriggerVoiceCall,
  onUpdateGuest,
}: {
  guest: GuestRecord;
  onTriggerVoiceCall: (guestId: string, callMode: VoiceCallMode) => Promise<string | null>;
  onUpdateGuest: (guestId: string, form: GuestFormState) => Promise<string | null>;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <GuestEditSheet guest={guest} onSave={onUpdateGuest} compact />
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
  onLoadCallLogs,
}: {
  guest: GuestRecord;
  onTriggerVoiceCall: (guestId: string, callMode: VoiceCallMode) => Promise<string | null>;
  onUpdateRsvp: (guestId: string, payload: { rsvpStatus: RsvpStatus; groupSize: number }) => Promise<string | null>;
  onUpdateGuest: (guestId: string, form: GuestFormState) => Promise<string | null>;
  onLoadCallLogs: (guestId: string) => Promise<GuestCallLogs>;
}) {
  const [open, setOpen] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [groupSize, setGroupSize] = useState(guest.groupSize);
  const [savedRsvpStatus, setSavedRsvpStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [savedGroupSize, setSavedGroupSize] = useState(guest.groupSize);
  const [busy, setBusy] = useState(false);
  const [callLogs, setCallLogs] = useState<GuestCallLogs | null>(null);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [callLogsError, setCallLogsError] = useState<string | null>(null);
  const voiceDisabled = savedRsvpStatus !== "PENDING";

  const loadCallLogs = useCallback(async () => {
    setCallLogsLoading(true);
    setCallLogsError(null);
    try {
      const result = await onLoadCallLogs(guest.id);
      setCallLogs(result);
    } catch (error) {
      setCallLogsError(error instanceof Error ? error.message : "Could not load call logs");
    } finally {
      setCallLogsLoading(false);
    }
  }, [guest.id, onLoadCallLogs]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !callLogs && !callLogsLoading) {
      void loadCallLogs();
    }
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
        render={<Button variant="ghost" size="icon" type="button" aria-label={`View ${guest.name}`} />}
      >
        <ChevronRight className="size-4 text-muted-foreground" />
      </SheetTrigger>
      <SheetContent className="min-h-0 overflow-hidden sm:max-w-2xl">
        <SheetHeader className="shrink-0">
          <SheetTitle>{guest.name}</SheetTitle>
          <SheetDescription>
            Guest profile, pickup details, voice call status, and check-in context.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-6">
          <section className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                Contact Info
              </p>
              <GuestEditSheet guest={guest} onSave={onUpdateGuest} />
            </div>
            {guest.phone && (
              <p className="flex items-center gap-2 text-sm">
                <Phone className="size-4" />
                {guest.phone}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{guest.email || "No email"}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Category {guest.category} · Group {guest.groupSize}
              {guest.pickupLocation ? ` · ${guest.pickupLocation}` : ""}
            </p>
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
              Voice outreach and QR
            </p>
            <p className="text-sm text-muted-foreground">
              {voiceDisabled
                ? `Outbound calls disabled because RSVP is ${savedRsvpStatus.toLowerCase()}.`
                : guest.ivrRespondedAt
                  ? `Last voice response ${new Date(guest.ivrRespondedAt).toLocaleString()}`
                  : "No voice response yet"}
            </p>
            <div className="mt-4">
              <GuestVoiceActionButtons
                guestId={guest.id}
                guestName={guest.name}
                rsvpStatus={savedRsvpStatus}
                onTriggerVoiceCall={onTriggerVoiceCall}
              />
            </div>
            <div className="mt-3">
              <GuestQrDialog guest={guest} />
            </div>
          </section>

          <GuestCallLogsSection
            logs={callLogs}
            loading={callLogsLoading}
            error={callLogsError}
            onRefresh={loadCallLogs}
          />

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

function formatDateTime(value: string | null) {
  if (!value) return "Unknown time";
  return new Date(value).toLocaleString();
}

function formatEntryTitle(entry: GuestCallLogEntry) {
  if (entry.type === "rsvp") return entry.outcome ? `RSVP ${entry.outcome}` : "RSVP captured";
  if (entry.type === "transcript") return "Transcript received";
  if (entry.type === "call_status") return `Call ${entry.status || "status"}`;
  if (entry.type === "error") return "Call error";
  return entry.eventName || entry.status || entry.type;
}

function renderCallLogIcon(entry: GuestCallLogEntry) {
  if (entry.type === "transcript") return <FileAudio className="size-4" />;
  if (entry.type === "rsvp") return <MessageSquareText className="size-4" />;
  return <Clock3 className="size-4" />;
}

function GuestCallLogItem({ entry }: { entry: GuestCallLogEntry }) {
  const details = [
    entry.rsvpStatus ? `RSVP ${entry.rsvpStatus}` : null,
    entry.groupSize ? `Group ${entry.groupSize}` : null,
    entry.needsCab === true ? "Cab needed" : entry.needsCab === false ? "No cab" : null,
    entry.needsHotel === true ? "Hotel needed" : entry.needsHotel === false ? "No hotel" : null,
    entry.language ? `Language ${entry.language}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-md bg-surface-container-low p-1.5 text-muted-foreground">
          {renderCallLogIcon(entry)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{formatEntryTitle(entry)}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {entry.source.replace("_", " ")}
            {entry.callUuid ? ` · ${entry.callUuid.slice(0, 8)}` : ""}
          </p>
          {details.length ? (
            <p className="mt-2 text-xs text-muted-foreground">{details.join(" · ")}</p>
          ) : null}
          {entry.pickupLocation || entry.guestNotes ? (
            <p className="mt-2 text-sm text-foreground">
              {[entry.pickupLocation, entry.guestNotes].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {entry.transcription ? (
            <p className="mt-2 rounded-md bg-surface-container-low p-2 text-sm text-foreground">
              {entry.transcription}
            </p>
          ) : null}
          {entry.recordingUrl ? (
            <a
              href={entry.recordingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
            >
              Open recording
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GuestCallLogsSection({
  logs,
  loading,
  error,
  onRefresh,
}: {
  logs: GuestCallLogs | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">
            Call Logs
          </p>
          {logs ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {logs.summary.totalCalls} calls · {logs.summary.totalIvrLogs} response logs
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          aria-label="Refresh call logs"
          disabled={loading}
          onClick={() => void onRefresh()}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && !logs ? (
        <p className="text-sm text-muted-foreground">Loading call logs...</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {!loading && !error && logs && !logs.timeline.length ? (
        <p className="text-sm text-muted-foreground">No voice call logs yet.</p>
      ) : null}
      {logs?.timeline.length ? (
        <div className="space-y-2">
          {logs.timeline.slice(0, 12).map((entry) => (
            <GuestCallLogItem key={entry.id} entry={entry} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function GuestTable({
  guests,
  onTriggerVoiceCall,
  onUpdateRsvp,
  onUpdateGuest,
  onLoadCallLogs,
}: {
  guests: GuestRecord[];
  onTriggerVoiceCall: (guestId: string, callMode: VoiceCallMode) => Promise<string | null>;
  onUpdateRsvp: (guestId: string, payload: { rsvpStatus: RsvpStatus; groupSize: number }) => Promise<string | null>;
  onUpdateGuest: (guestId: string, form: GuestFormState) => Promise<string | null>;
  onLoadCallLogs: (guestId: string) => Promise<GuestCallLogs>;
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
                  onLoadCallLogs={onLoadCallLogs}
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
