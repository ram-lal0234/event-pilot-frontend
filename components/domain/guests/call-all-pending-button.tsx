"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getVoiceCallErrorMessage, voiceCallModeCopy } from "@/lib/voice-messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CallAllPendingButtonProps = {
  token: string;
  eventId: string;
  pendingCount: number;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  className?: string;
  onQueued?: (result: { queued: number; skipped: number }) => void;
};

export function CallAllPendingButton({
  token,
  eventId,
  pendingCount,
  variant = "outline",
  size = "sm",
  className,
  onQueued,
}: CallAllPendingButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const result = await api.triggerBulkVoiceCalls(token, eventId, "ai");
      onQueued?.({ queued: result.queued, skipped: result.skipped });
      toast.success(
        result.queued
          ? `Calling ${result.queued} guest${result.queued === 1 ? "" : "s"} now`
          : "No calls were started",
        {
          description:
            result.skipped > 0
              ? `${result.skipped} guest${result.skipped === 1 ? "" : "s"} skipped — already on a call or unavailable`
              : undefined,
        },
      );
      setOpen(false);
    } catch (err) {
      toast.error(getVoiceCallErrorMessage(err, "We couldn't start calling guests. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size={size}
            className={className}
            disabled={pendingCount < 1}
          >
            <Bot className="size-4" />
            Call all pending
            {pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Button>
        }
      />
      <DialogContent showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Call all guests who haven't replied?</DialogTitle>
          <DialogDescription>
            We'll call each guest with a pending reply ({pendingCount} guest
            {pendingCount === 1 ? "" : "s"}). {voiceCallModeCopy.ai.confirmDescription} Guests already
            on a call will be skipped. Calls are placed one at a time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" loading={busy} loadingText="Starting calls…" onClick={() => void run()}>
            Call {pendingCount} guest{pendingCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
