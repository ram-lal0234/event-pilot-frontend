"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Bot, Hash, MessageCircle, QrCode, Settings } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formLimits } from "@/lib/form-limits";
import { api, type EventRecord } from "@/lib/api";
import { DEFAULT_WHATSAPP_MESSAGE_TEMPLATE } from "@/lib/whatsapp-invite";
import { isOutreachWhatsAppOnly } from "@/lib/event-ops-settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventSettingsSheet({
  eventId,
  canWrite,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  eventId: string;
  canWrite: boolean;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { token, refreshEvents } = useApp();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [voiceAiEnabled, setVoiceAiEnabled] = useState(true);
  const [ivrEnabled, setIvrEnabled] = useState(true);
  const [qrEnabled, setQrEnabled] = useState(true);
  const [outreachEnabled, setOutreachEnabled] = useState(false);
  const [outreachAutoStart, setOutreachAutoStart] = useState(false);
  const [outreachVoiceDelayHours, setOutreachVoiceDelayHours] = useState(24);
  const [outreachAutoCallMode, setOutreachAutoCallMode] = useState<"ai" | "ivr">("ai");
  const [outreachReminderEnabled, setOutreachReminderEnabled] = useState(true);
  const [outreachMessageTemplate, setOutreachMessageTemplate] = useState(DEFAULT_WHATSAPP_MESSAGE_TEMPLATE);
  const [confirmWhatsAppOnlyOpen, setConfirmWhatsAppOnlyOpen] = useState(false);

  const applyEvent = useCallback((event: EventRecord) => {
    setName(event.name);
    setDate(toDatetimeLocalValue(event.date));
    setLocation(event.location);
    setVoiceAiEnabled(event.setting?.voiceAiEnabled ?? true);
    setIvrEnabled(event.setting?.ivrEnabled ?? true);
    setQrEnabled(event.setting?.qrEnabled ?? true);
    setOutreachEnabled(event.setting?.outreachEnabled ?? false);
    setOutreachAutoStart(event.setting?.outreachAutoStart ?? false);
    setOutreachVoiceDelayHours(event.setting?.outreachVoiceDelayHours ?? 24);
    setOutreachAutoCallMode(event.setting?.outreachAutoCallMode === "ivr" ? "ivr" : "ai");
    setOutreachReminderEnabled(event.setting?.outreachReminderEnabled !== false);
    setOutreachMessageTemplate(
      event.setting?.outreachMessageTemplate?.trim() || DEFAULT_WHATSAPP_MESSAGE_TEMPLATE,
    );
  }, []);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      applyEvent(await api.getEvent(token, eventId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load event settings");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [applyEvent, eventId, token]);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [load, open]);

  const persistSettings = async () => {
    setBusy(true);
    try {
      const updated = await api.updateEvent(token, eventId, {
        name,
        date: new Date(date).toISOString(),
        location,
        voiceAiEnabled,
        ivrEnabled,
        qrEnabled,
        outreachEnabled,
        outreachAutoStart,
        outreachVoiceDelayHours,
        outreachAutoCallMode,
        outreachReminderEnabled,
        outreachMessageTemplate,
      });
      applyEvent(updated);
      await refreshEvents();
      toast.success("Event settings saved");
      setConfirmWhatsAppOnlyOpen(false);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canWrite) {
      toast.error("Read-only access — you cannot change event settings");
      return;
    }

    if (isOutreachWhatsAppOnly(outreachEnabled, voiceAiEnabled, ivrEnabled)) {
      setConfirmWhatsAppOnlyOpen(true);
      return;
    }

    await persistSettings();
  };

  return (
    <>
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? <SheetTrigger render={trigger} /> : null}
      <SheetContent className="sm:max-w-md">
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              Event settings
            </SheetTitle>
            <SheetDescription>
              Update event details and control voice calls / QR check-in.
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-foreground">Event details</p>
                  <label className="block space-y-1 text-sm font-medium">
                    <span>Name</span>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={!canWrite}
                      minLength={formLimits.eventName.minLength}
                      maxLength={formLimits.eventName.maxLength}
                    />
                  </label>
                  <label className="block space-y-1 text-sm font-medium">
                    <span>Date & time</span>
                    <Input
                      type="datetime-local"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      disabled={!canWrite}
                    />
                  </label>
                  <label className="block space-y-1 text-sm font-medium">
                    <span>Location</span>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      disabled={!canWrite}
                      minLength={formLimits.location.minLength}
                      maxLength={formLimits.location.maxLength}
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Operations</p>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                    <Checkbox
                      checked={voiceAiEnabled}
                      disabled={!canWrite}
                      onChange={(e) => setVoiceAiEnabled(e.target.checked)}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-medium">
                        <Bot className="size-4 text-primary" />
                        AI voice calls
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Allow AI agent outbound calls that capture RSVP conversationally.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                    <Checkbox
                      checked={ivrEnabled}
                      disabled={!canWrite}
                      onChange={(e) => setIvrEnabled(e.target.checked)}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-medium">
                        <Hash className="size-4 text-primary" />
                        IVR / keypad calls
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Allow keypad IVR calls where guests confirm or decline with number keys.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                    <Checkbox
                      checked={qrEnabled}
                      disabled={!canWrite}
                      onChange={(e) => setQrEnabled(e.target.checked)}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-medium">
                        <QrCode className="size-4 text-primary" />
                        QR check-in
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Allow gate and hotel QR scans for this event.
                      </span>
                    </span>
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">WhatsApp-first outreach</p>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                    <Checkbox
                      checked={outreachEnabled}
                      disabled={!canWrite}
                      onChange={(e) => setOutreachEnabled(e.target.checked)}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-medium">
                        <MessageCircle className="size-4 text-primary" />
                        Enable automated outreach
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Send RSVP link on WhatsApp, auto-call pending guests, then send one reminder.
                      </span>
                    </span>
                  </label>
                  {outreachEnabled ? (
                    <div className="space-y-3 rounded-md border border-border p-3">
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          checked={outreachAutoStart}
                          disabled={!canWrite}
                          onChange={(e) => setOutreachAutoStart(e.target.checked)}
                        />
                        <span className="min-w-0 text-sm">
                          <span className="font-medium">Auto-start on new guests</span>
                          <span className="mt-1 block text-muted-foreground">
                            Send WhatsApp when a guest is added or imported (if bridge is running).
                          </span>
                        </span>
                      </label>
                      <label className="block space-y-1 text-sm font-medium">
                        <span>Voice call delay (hours)</span>
                        <Input
                          type="number"
                          min={1}
                          max={48}
                          value={outreachVoiceDelayHours}
                          disabled={!canWrite}
                          onChange={(e) => setOutreachVoiceDelayHours(Number(e.target.value) || 24)}
                        />
                      </label>
                      <label className="block space-y-1 text-sm font-medium">
                        <span>Auto-call mode</span>
                        <select
                          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                          value={outreachAutoCallMode}
                          disabled={!canWrite}
                          onChange={(e) => setOutreachAutoCallMode(e.target.value as "ai" | "ivr")}
                        >
                          <option value="ai">AI voice agent</option>
                          <option value="ivr">IVR / keypad</option>
                        </select>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          checked={outreachReminderEnabled}
                          disabled={!canWrite}
                          onChange={(e) => setOutreachReminderEnabled(e.target.checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          Send one WhatsApp reminder after a failed auto-call
                        </span>
                      </label>
                      <label className="block space-y-1 text-sm font-medium">
                        <span>WhatsApp message template</span>
                        <Textarea
                          value={outreachMessageTemplate}
                          disabled={!canWrite}
                          rows={5}
                          onChange={(e) => setOutreachMessageTemplate(e.target.value)}
                        />
                        <span className="text-xs font-normal text-muted-foreground">
                          Placeholders: {"{{guestName}}"}, {"{{eventName}}"}, {"{{rsvpLink}}"}
                        </span>
                      </label>
                    </div>
                  ) : null}
                </div>

                {!canWrite ? (
                  <p className="text-sm text-muted-foreground">You have read-only access to this event.</p>
                ) : null}
              </>
            )}
          </SheetBody>

          {canWrite ? (
            <SheetFooter>
              <Button type="submit" loading={busy} loadingText="Saving settings" disabled={loading}>
                Save settings
              </Button>
            </SheetFooter>
          ) : null}
        </form>
      </SheetContent>
    </Sheet>

    <Dialog open={confirmWhatsAppOnlyOpen} onOpenChange={setConfirmWhatsAppOnlyOpen}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>WhatsApp-only outreach</DialogTitle>
          <DialogDescription>
            You enabled WhatsApp outreach but disabled both AI voice calls and IVR calls.
            Automated outreach will send WhatsApp messages only — no auto-calls or post-call
            reminders will run until you turn a call type back on.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setConfirmWhatsAppOnlyOpen(false)}
          >
            Go back
          </Button>
          <Button
            type="button"
            loading={busy}
            loadingText="Saving settings"
            onClick={() => void persistSettings()}
          >
            Save WhatsApp-only
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
