"use client";

import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

export function StartOutreachButton({
  eventId,
  onStarted,
  size = "sm",
  className,
}: {
  eventId: string;
  onStarted?: () => void;
  size?: "sm" | "default";
  className?: string;
}) {
  const { token } = useApp();

  const startBatch = async () => {
    if (!token) return;
    try {
      const result = await api.startOutreachBatch(token, eventId);
      toast.success(`WhatsApp messages sent to ${result.queued ?? result.sent} guest${(result.queued ?? result.sent) === 1 ? "" : "s"}`);
      if (result.failed > 0) {
        toast.message(
          `${result.failed} guest${result.failed === 1 ? "" : "s"} couldn't be reached — check phone numbers and settings`,
        );
      }
      onStarted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't start outreach. Please try again.");
    }
  };

  return (
    <Button
      type="button"
      size={size}
      className={className}
      onClick={() => void startBatch()}
    >
      <Play className="size-3.5" />
      Send invites now
    </Button>
  );
}
