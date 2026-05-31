"use client";

import { useState, type FormEvent } from "react";
import {
  Bot,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  QrCode,
  Radio,
  Send,
} from "lucide-react";
import { GuestEditSheet } from "@/components/domain/guests/guest-edit-sheet";
import {
  GuestWhatsAppActions,
  useGuestWhatsAppActions,
} from "@/components/domain/whatsapp/guest-whatsapp-actions";
import type { GuestFormState } from "@/lib/guest-form";
import type { GuestOpsFormState } from "@/components/domain/guests/guest-ops-fields";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { resolvePublicRsvpUrl } from "@/lib/public-rsvp-url";
import { api, type GuestRecord, RsvpStatus } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { StatusBadge } from "@/components/domain/status-badge";
import { outreachStatusLabels, outreachStatusVariant } from "@/lib/outreach";
import {
  isAiVoiceEnabled,
  isIvrEnabled,
  isQrCheckinEnabled,
} from "@/lib/event-ops-settings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import {
  voiceCallModeCopy,
  voiceCallUi,
  type VoiceCallMode,
} from "@/lib/voice-messages";

export type { VoiceCallMode };

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

function GuestQrDialog({
  guest,
  compact = false,
  open,
  onOpenChange,
  hideTrigger = false,
}: {
  guest: GuestRecord;
  compact?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger ? (
        compact ? (
          <Tooltip>
            <TooltipTrigger render={dialogTrigger} />
            <TooltipContent>View QR code</TooltipContent>
          </Tooltip>
        ) : (
          dialogTrigger
        )
      ) : null}
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
    title: voiceCallModeCopy.ai.confirmTitle,
    description: voiceCallModeCopy.ai.confirmDescription,
    confirmLabel: voiceCallModeCopy.ai.confirmButton,
  },
  ivr: {
    title: voiceCallModeCopy.ivr.confirmTitle,
    description: voiceCallModeCopy.ivr.confirmDescription,
    confirmLabel: voiceCallModeCopy.ivr.confirmButton,
  },
};

function GuestVoiceActionButtons({
  guestId,
  guestName,
  rsvpStatus,
  onTriggerVoiceCall,
  compact = false,
  layout = "compact",
}: {
  guestId: string;
  guestName?: string;
  rsvpStatus: RsvpStatus;
  onTriggerVoiceCall: (guestId: string, callMode: VoiceCallMode) => Promise<string | null>;
  compact?: boolean;
  layout?: "compact" | "inline" | "menu";
}) {
  const { canTriggerVoice } = useEventAccess();
  const { currentEvent } = useApp();
  const aiCallEnabled = isAiVoiceEnabled(currentEvent);
  const ivrCallEnabled = isIvrEnabled(currentEvent);
  const [confirmMode, setConfirmMode] = useState<VoiceCallMode | null>(null);
  const [voiceBusy, setVoiceBusy] = useState<VoiceCallMode | null>(null);
  const voiceDisabled = rsvpStatus !== "PENDING" || !canTriggerVoice;

  const isModeDisabled = (mode: VoiceCallMode) => {
    if (voiceDisabled || voiceBusy) return true;
    if (mode === "ai") return !aiCallEnabled;
    return !ivrCallEnabled;
  };

  const triggerCall = async (mode: VoiceCallMode) => {
    if (isModeDisabled(mode)) return;

    setVoiceBusy(mode);
    const errorMessage = await onTriggerVoiceCall(guestId, mode);
    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      toast.success(voiceCallModeCopy[mode].successToast);
    }
    setVoiceBusy(null);
    setConfirmMode(null);
  };

  const openConfirm = (mode: VoiceCallMode) => {
    if (isModeDisabled(mode)) return;
    setConfirmMode(mode);
  };

  const voiceTooltip = (mode: VoiceCallMode) => {
    if (mode === "ai" && !aiCallEnabled) return voiceCallModeCopy.ai.disabledInSettings;
    if (mode === "ivr" && !ivrCallEnabled) return voiceCallModeCopy.ivr.disabledInSettings;
    if (voiceDisabled) return voiceCallUi.pendingGuestOnly;
    return mode === "ai" ? voiceCallModeCopy.ai.button : voiceCallModeCopy.ivr.button;
  };

  const confirmCopy = confirmMode ? voiceCallConfirmCopy[confirmMode] : null;

  const aiButton = (
    <Button
      variant={compact ? "ghost" : "default"}
      size={compact ? "icon-sm" : "sm"}
      className={compact ? undefined : "gap-2"}
      type="button"
      aria-label={voiceCallModeCopy.ai.ariaLabel}
      disabled={isModeDisabled("ai")}
      onClick={() => openConfirm("ai")}
    >
      <Bot className="size-4" />
      {!compact ? voiceCallModeCopy.ai.button : null}
    </Button>
  );

  const ivrButton = (
    <Button
      variant="outline"
      size={compact ? "icon-sm" : "sm"}
      className={compact ? undefined : "gap-2"}
      type="button"
      aria-label={voiceCallModeCopy.ivr.ariaLabel}
      disabled={isModeDisabled("ivr")}
      onClick={() => openConfirm("ivr")}
    >
      <Radio className="size-4" />
      {!compact ? voiceCallModeCopy.ivr.button : null}
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
                loadingText={voiceCallUi.startingCall}
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

  if (layout === "inline" || !compact) {
    return (
      <>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {aiCallEnabled ? aiButton : null}
          {ivrCallEnabled ? ivrButton : null}
        </div>
        {confirmDialog}
      </>
    );
  }

  if (layout === "menu") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label={voiceCallUi.callGuest}
                disabled={voiceDisabled || (!aiCallEnabled && !ivrCallEnabled)}
              >
                <Phone className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            {aiCallEnabled ? (
              <DropdownMenuItem disabled={isModeDisabled("ai")} onClick={() => openConfirm("ai")}>
                <Bot className="size-4" />
                {voiceCallModeCopy.ai.menu}
              </DropdownMenuItem>
            ) : null}
            {ivrCallEnabled ? (
              <DropdownMenuItem disabled={isModeDisabled("ivr")} onClick={() => openConfirm("ivr")}>
                <Radio className="size-4" />
                {voiceCallModeCopy.ivr.menu}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      {aiCallEnabled ? (
        <Tooltip>
          <TooltipTrigger render={aiButton} />
          <TooltipContent>{voiceTooltip("ai")}</TooltipContent>
        </Tooltip>
      ) : null}
      {ivrCallEnabled ? (
        <Tooltip>
          <TooltipTrigger render={ivrButton} />
          <TooltipContent>{voiceTooltip("ivr")}</TooltipContent>
        </Tooltip>
      ) : null}
      {confirmDialog}
    </>
  );
}

function GuestOperationsCell({ guest }: { guest: GuestRecord }) {
  const logistics = [guest.needsCab ? "Cab" : null, guest.needsHotel ? "Hotel" : null].filter(
    Boolean,
  ) as string[];
  const followUp =
    guest.followUpStatus && guest.followUpStatus !== "NONE"
      ? guest.followUpStatus.replaceAll("_", " ").toLowerCase()
      : null;

  return (
    <div className="max-w-[240px] text-sm">
      <p className="text-foreground">
        Group {guest.groupSize}
        {guest.pickupLocation ? ` · ${guest.pickupLocation}` : " · No pickup"}
      </p>
      {logistics.length > 0 || followUp ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {logistics.map((label) => (
            <span
              key={label}
              className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[11px] font-medium text-foreground"
            >
              {label}
            </span>
          ))}
          {followUp ? <span className="text-xs text-muted-foreground capitalize">{followUp}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

async function copyGuestRsvpLink(token: string, guest: GuestRecord) {
  let backendUrl = guest.publicRsvpUrl;
  let inviteCode = guest.inviteCode;
  if (!backendUrl && !inviteCode) {
    const link = await api.getGuestRsvpLink(token, guest.id);
    backendUrl = link.publicRsvpUrl;
    inviteCode = link.inviteCode;
  }
  const url = resolvePublicRsvpUrl(backendUrl, inviteCode);
  if (!url) {
    toast.error("We couldn't copy the RSVP link. Check your app settings and try again.");
    return;
  }
  await navigator.clipboard.writeText(url);
  toast.success("RSVP link copied");
}

function GuestTableActionsMenu({
  guest,
  onTriggerVoiceCall,
  onUpdateGuest,
}: {
  guest: GuestRecord;
  onTriggerVoiceCall: (guestId: string, callMode: VoiceCallMode) => Promise<string | null>;
  onUpdateGuest: (guestId: string, form: GuestFormState, ops: GuestOpsFormState) => Promise<string | null>;
}) {
  const { token, currentEvent } = useApp();
  const { canWrite, canTriggerVoice } = useEventAccess();
  const aiCallEnabled = isAiVoiceEnabled(currentEvent);
  const ivrCallEnabled = isIvrEnabled(currentEvent);
  const qrCheckinEnabled = isQrCheckinEnabled(currentEvent);
  const [qrOpen, setQrOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [confirmMode, setConfirmMode] = useState<VoiceCallMode | null>(null);
  const [voiceBusy, setVoiceBusy] = useState<VoiceCallMode | null>(null);
  const voiceDisabled = guest.rsvpStatus !== "PENDING" || !canTriggerVoice;
  const whatsapp = useGuestWhatsAppActions(guest, currentEvent);

  const isVoiceModeDisabled = (mode: VoiceCallMode) => {
    if (voiceDisabled || voiceBusy) return true;
    if (mode === "ai") return !aiCallEnabled;
    return !ivrCallEnabled;
  };

  const handleCopyLink = async () => {
    setCopyBusy(true);
    try {
      await copyGuestRsvpLink(token, guest);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not get RSVP link");
    } finally {
      setCopyBusy(false);
    }
  };

  const triggerCall = async (mode: VoiceCallMode) => {
    if (isVoiceModeDisabled(mode)) return;

    setVoiceBusy(mode);
    const errorMessage = await onTriggerVoiceCall(guest.id, mode);
    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      toast.success(voiceCallModeCopy[mode].successToast);
    }
    setVoiceBusy(null);
    setConfirmMode(null);
  };

  const openConfirm = (mode: VoiceCallMode) => {
    if (isVoiceModeDisabled(mode)) return;
    setConfirmMode(mode);
  };

  const confirmCopy = confirmMode ? voiceCallConfirmCopy[confirmMode] : null;

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    type="button"
                    aria-label={`Actions for ${guest.name}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
            }
          />
          <TooltipContent>Actions — RSVP link, WhatsApp, calls, QR</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem disabled={copyBusy} onClick={() => void handleCopyLink()}>
            <Copy className="size-4" />
            Copy RSVP link
          </DropdownMenuItem>
          {qrCheckinEnabled ? (
            <DropdownMenuItem onClick={() => setQrOpen(true)}>
              <QrCode className="size-4" />
              View QR code
            </DropdownMenuItem>
          ) : null}
          {canWrite ? (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit guest
            </DropdownMenuItem>
          ) : null}
          {currentEvent ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={whatsapp.busy}
                onClick={() => void whatsapp.sendViaLocalBridge()}
              >
                <Send className="size-4" />
                Send WhatsApp (local API)
              </DropdownMenuItem>
              <DropdownMenuItem disabled={whatsapp.busy} onClick={() => void whatsapp.copyMessage()}>
                <Copy className="size-4" />
                Copy WhatsApp message
              </DropdownMenuItem>
              <DropdownMenuItem disabled={whatsapp.busy} onClick={() => void whatsapp.openWhatsApp()}>
                <ExternalLink className="size-4" />
                Open WhatsApp (wa.me)
              </DropdownMenuItem>
            </>
          ) : null}
          {aiCallEnabled || ivrCallEnabled ? <DropdownMenuSeparator /> : null}
          {aiCallEnabled ? (
            <DropdownMenuItem disabled={isVoiceModeDisabled("ai")} onClick={() => openConfirm("ai")}>
              <Bot className="size-4" />
              {voiceCallModeCopy.ai.menu}
            </DropdownMenuItem>
          ) : null}
          {ivrCallEnabled ? (
            <DropdownMenuItem disabled={isVoiceModeDisabled("ivr")} onClick={() => openConfirm("ivr")}>
              <Radio className="size-4" />
              {voiceCallModeCopy.ivr.menu}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <GuestQrDialog guest={guest} open={qrOpen} onOpenChange={setQrOpen} hideTrigger />
      {canWrite ? (
        <GuestEditSheet
          guest={guest}
          onSave={onUpdateGuest}
          open={editOpen}
          onOpenChange={setEditOpen}
          hideTrigger
        />
      ) : null}
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
                  <span className="font-medium text-foreground">{guest.name}</span>
                  {" — "}
                  {confirmCopy.description}
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
                  loadingText={voiceCallUi.startingCall}
                  onClick={() => void triggerCall(confirmMode)}
                >
                  {confirmCopy.confirmLabel}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
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
      let backendUrl = guest.publicRsvpUrl;
      let inviteCode = guest.inviteCode;
      if (!backendUrl && !inviteCode) {
        const link = await api.getGuestRsvpLink(token, guest.id);
        backendUrl = link.publicRsvpUrl;
        inviteCode = link.inviteCode;
      }
      const url = resolvePublicRsvpUrl(backendUrl, inviteCode);
      if (!url) {
        toast.error("We couldn't copy the RSVP link. Check your app settings and try again.");
        return;
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
  return (
    <div className="flex items-center justify-end">
      <GuestTableActionsMenu
        guest={guest}
        onTriggerVoiceCall={onTriggerVoiceCall}
        onUpdateGuest={onUpdateGuest}
      />
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
  const aiCallEnabled = isAiVoiceEnabled(currentEvent);
  const ivrCallEnabled = isIvrEnabled(currentEvent);
  const qrCheckinEnabled = isQrCheckinEnabled(currentEvent);
  const voiceDisabled = savedRsvpStatus !== "PENDING" || !canTriggerVoice;
  const voiceCallsConfigured = aiCallEnabled || ivrCallEnabled;
  const publicRsvpLink = resolvePublicRsvpUrl(guest.publicRsvpUrl, guest.inviteCode);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setRsvpStatus(guest.rsvpStatus);
      setGroupSize(guest.groupSize);
      setSavedRsvpStatus(guest.rsvpStatus);
      setSavedGroupSize(guest.groupSize);
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
            {publicRsvpLink ? (
              <div className="mt-3 rounded-md border border-border bg-surface-container-low px-3 py-2">
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Public RSVP link
                </p>
                <p className="mt-1 line-clamp-2 font-mono text-xs text-foreground" title={publicRsvpLink}>
                  {publicRsvpLink}
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
                loadingText={voiceCallUi.savingRsvp}
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

          {voiceCallsConfigured ? (
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
                      layout="inline"
                    />
                  </div>
                </>
              )}
            </section>
          ) : null}

          {qrCheckinEnabled ? (
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
          ) : null}
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
      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow>
            <TableHead>Guest Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>RSVP</TableHead>
            <TableHead>Operations</TableHead>
            <TableHead>Check-In</TableHead>
            <TableHead className="w-[7.5rem] text-right">Actions</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length ? guests.map((guest) => (
            <TableRow key={guest.id}>
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
              <TableCell>
                <GuestOperationsCell guest={guest} />
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
