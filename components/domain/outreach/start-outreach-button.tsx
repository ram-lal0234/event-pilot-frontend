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
      toast.success(`Queued WhatsApp for ${result.queued ?? result.sent} guest(s)`);
      if (result.failed > 0) {
        toast.message(
          `${result.failed} guest(s) could not be queued — check phone numbers and settings`,
        );
      }
      onStarted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start outreach");
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
