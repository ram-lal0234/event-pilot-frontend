"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Bot, Hash, QrCode, Settings } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formLimits } from "@/lib/form-limits";
import { api, type EventRecord } from "@/lib/api";
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
}: {
  eventId: string;
  canWrite: boolean;
  trigger: ReactElement;
}) {
  const { token, refreshEvents } = useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [voiceAiEnabled, setVoiceAiEnabled] = useState(true);
  const [ivrEnabled, setIvrEnabled] = useState(true);
  const [qrEnabled, setQrEnabled] = useState(true);

  const applyEvent = useCallback((event: EventRecord) => {
    setName(event.name);
    setDate(toDatetimeLocalValue(event.date));
    setLocation(event.location);
    setVoiceAiEnabled(event.setting?.voiceAiEnabled ?? true);
    setIvrEnabled(event.setting?.ivrEnabled ?? true);
    setQrEnabled(event.setting?.qrEnabled ?? true);
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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canWrite) {
      toast.error("Read-only access — you cannot change event settings");
      return;
    }

    setBusy(true);
    try {
      const updated = await api.updateEvent(token, eventId, {
        name,
        date: new Date(date).toISOString(),
        location,
        voiceAiEnabled,
        ivrEnabled,
        qrEnabled,
      });
      applyEvent(updated);
      await refreshEvents();
      toast.success("Event settings saved");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
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
  );
}
