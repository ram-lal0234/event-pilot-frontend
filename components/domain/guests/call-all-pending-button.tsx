"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
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
          ? `Queued ${result.queued} AI call${result.queued === 1 ? "" : "s"}`
          : "No calls were queued",
        {
          description:
            result.skipped > 0
              ? `${result.skipped} guest(s) skipped (already calling or error)`
              : undefined,
        },
      );
      setOpen(false);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "We couldn't start the campaign. Please try again.";
      toast.error(message);
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
          <DialogTitle>Call all pending guests?</DialogTitle>
          <DialogDescription>
            This queues an AI voice call for each guest with RSVP status Pending (
            {pendingCount} guest{pendingCount === 1 ? "" : "s"}). Guests already on a call are
            skipped. Calls run through the dialer queue one at a time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" loading={busy} loadingText="Queuing…" onClick={() => void run()}>
            Queue {pendingCount} call{pendingCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
