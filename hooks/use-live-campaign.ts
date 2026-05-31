"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRealtimeBus } from "@/components/providers/realtime-provider";
import type { DashboardSummary } from "@/lib/api";
import type { RealtimeMessage } from "@/lib/realtime/types";
import { liveCallStatusLabel } from "@/lib/voice-messages";

export type CampaignRecentItem = {
  id: string;
  guestName: string;
  detail: string;
  tone: "success" | "error" | "warning" | "muted";
  ts: number;
};

export type ActiveCallState = {
  guestId: string;
  guestName: string;
  status: string;
  since: number;
};

const MAX_RECENT = 8;

function callStatusLabel(status?: string | null) {
  return liveCallStatusLabel(status);
}

function outcomeFromMessage(message: RealtimeMessage): {
  detail: string;
  tone: CampaignRecentItem["tone"];
} {
  const rsvp = message.guest?.rsvpStatus;
  const outcome = message.callOutcome || message.call?.callOutcome;

  if (rsvp === "CONFIRMED" || outcome === "completed" || outcome === "confirmed") {
    return { detail: "Confirmed", tone: "success" };
  }
  if (rsvp === "DECLINED" || outcome === "declined") {
    return { detail: "Declined", tone: "error" };
  }
  if (outcome === "callback_later" || message.guest?.followUpStatus === "CALLBACK_LATER") {
    return { detail: "Callback scheduled", tone: "warning" };
  }
  if (outcome === "no_answer" || outcome === "voicemail") {
    return { detail: "No answer", tone: "muted" };
  }
  if (message.type === "call_completed") {
    return { detail: "Call ended", tone: "muted" };
  }
  return { detail: "Updated", tone: "muted" };
}

export function useLiveCampaign(eventId: string | undefined, summary: DashboardSummary | null) {
  const { subscribe, connectionState, enabled } = useRealtimeBus();
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [recent, setRecent] = useState<CampaignRecentItem[]>([]);
  const [lastBulk, setLastBulk] = useState<{ queued: number; skipped: number; ts: number } | null>(
    null,
  );

  const [liveCounts, setLiveCounts] = useState({
    confirmed: 0,
    declined: 0,
    pending: 0,
  });

  useEffect(() => {
    if (!summary) return;
    setLiveCounts({
      confirmed: summary.confirmed ?? 0,
      declined: summary.declined ?? 0,
      pending: summary.pendingRsvp ?? 0,
    });
  }, [summary]);

  const pushRecent = useCallback((item: CampaignRecentItem) => {
    setRecent((current) => [item, ...current.filter((row) => row.id !== item.id)].slice(0, MAX_RECENT));
  }, []);

  useEffect(() => {
    if (!eventId) return;

    return subscribe((message) => {
      if (message.eventId && message.eventId !== eventId) {
        return;
      }

      if (message.type === "campaign_progress" && message.campaign) {
        setLastBulk({
          queued: message.campaign.queued ?? 0,
          skipped: message.campaign.skipped ?? 0,
          ts: message.ts || Date.now(),
        });
        return;
      }

      const guest = message.guest;
      if (!guest?.id) {
        return;
      }

      if (message.type === "call_started" || message.type === "call_answered") {
        setActiveCall({
          guestId: guest.id,
          guestName: guest.name,
          status: message.call?.status || "DIALING",
          since: message.ts || Date.now(),
        });
      }

      if (message.type === "call_completed" || message.type === "rsvp_updated") {
        const { detail, tone } = outcomeFromMessage(message);
        pushRecent({
          id: `${guest.id}-${message.ts || Date.now()}`,
          guestName: guest.name,
          detail,
          tone,
          ts: message.ts || Date.now(),
        });

        setActiveCall((current) => (current?.guestId === guest.id ? null : current));

        if (guest.rsvpStatus === "CONFIRMED") {
          setLiveCounts((c) => ({
            ...c,
            confirmed: c.confirmed + 1,
            pending: Math.max(0, c.pending - 1),
          }));
        } else if (guest.rsvpStatus === "DECLINED") {
          setLiveCounts((c) => ({
            ...c,
            declined: c.declined + 1,
            pending: Math.max(0, c.pending - 1),
          }));
        }
      }
    });
  }, [eventId, pushRecent, subscribe]);

  const totalGuests = summary?.totalGuests ?? 0;
  const responded = liveCounts.confirmed + liveCounts.declined;
  const progressPercent = totalGuests
    ? Math.min(100, Math.round((responded / totalGuests) * 100))
    : 0;

  const connectionLabel = useMemo(() => {
    if (!enabled) return "Updates paused";
    if (connectionState === "open") return "Live";
    if (connectionState === "reconnecting") return "Reconnecting…";
    if (connectionState === "failed") return "Offline";
    return "Connecting…";
  }, [connectionState, enabled]);

  return {
    activeCall,
    recent,
    lastBulk,
    liveCounts,
    totalGuests,
    progressPercent,
    connectionLabel,
    connectionState,
    activeCallLabel: activeCall ? callStatusLabel(activeCall.status) : null,
  };
}
