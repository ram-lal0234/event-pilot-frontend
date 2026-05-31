"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { StartOutreachButton } from "@/components/domain/outreach/start-outreach-button";
import { Button } from "@/components/ui/button";

function dismissKey(eventId: string) {
  return `event-pilot:outreach-banner-dismissed:${eventId}`;
}

export function OutreachStartBanner({
  eventId,
  guestCount,
  onStarted,
}: {
  eventId: string;
  guestCount: number;
  onStarted?: () => void;
}) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem(dismissKey(eventId)) === "1";
  });

  if (dismissed || guestCount < 1) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(dismissKey(eventId), "1");
    setDismissed(true);
  };

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MessageCircle className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">WhatsApp outreach isn&apos;t started yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Queue WhatsApp invites for your guest list. Voice follow-up runs automatically after your
            configured delay.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StartOutreachButton
          eventId={eventId}
          size="sm"
          className="gap-2"
          onStarted={() => {
            dismiss();
            onStarted?.();
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss outreach reminder"
          onClick={dismiss}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
