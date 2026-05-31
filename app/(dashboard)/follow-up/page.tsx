"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import {
  FollowUpGuestCard,
  ScheduledCallbackCard,
} from "@/components/domain/follow-up/follow-up-guest-card";
import {
  DashboardPage,
  DashboardPageSkeleton,
} from "@/components/layout/dashboard-page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api, type GuestRecord } from "@/lib/api";
import { getVoiceCallErrorMessage, voiceCallModeCopy } from "@/lib/voice-messages";

const ACTIVE_FOLLOW_UP =
  "NEEDS_FOLLOW_UP,CALLBACK_LATER,NO_ANSWER,VOICEMAIL";

type FollowUpStatus = NonNullable<GuestRecord["followUpStatus"]>;

export default function FollowUpPage() {
  const { token, currentEventId, eventsLoaded, eventsLoading } = useApp();
  const { canWrite, canTriggerVoice } = useEventAccess();
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelCallbackGuestId, setCancelCallbackGuestId] = useState<string | null>(null);
  const [clearFollowUpGuestId, setClearFollowUpGuestId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentEventId) {
      setGuests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api.listGuestsPage(token, currentEventId, {
        page: 1,
        pageSize: 100,
        followUpStatus: ACTIVE_FOLLOW_UP,
      });
      setGuests(result.items);
    } catch {
      toast.error("Couldn't load your follow-up list");
    } finally {
      setLoading(false);
    }
  }, [currentEventId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const scheduledCallbacks = useMemo(
    () =>
      guests
        .filter(
          (guest) =>
            guest.followUpStatus === "CALLBACK_LATER" && Boolean(guest.callbackAt),
        )
        .sort(
          (a, b) =>
            new Date(a.callbackAt || 0).getTime() - new Date(b.callbackAt || 0).getTime(),
        ),
    [guests],
  );

  const otherFollowUps = useMemo(
    () =>
      guests.filter(
        (guest) =>
          !(
            guest.followUpStatus === "CALLBACK_LATER" && Boolean(guest.callbackAt)
          ),
      ),
    [guests],
  );

  const updateStatus = async (guestId: string, followUpStatus: FollowUpStatus) => {
    setBusyId(guestId);
    try {
      await api.updateGuest(token, guestId, { followUpStatus });
      toast.success("Follow-up status updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const callNow = async (guestId: string) => {
    setBusyId(guestId);
    try {
      await api.triggerVoiceCall(token, guestId, "ai");
      toast.success(voiceCallModeCopy.ai.successToast);
      await load();
    } catch (err) {
      toast.error(getVoiceCallErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const reschedule = async (guest: GuestRecord, value: string) => {
    if (!value) return;
    setBusyId(guest.id);
    try {
      await api.updateGuest(token, guest.id, {
        followUpStatus: "CALLBACK_LATER",
        callbackAt: new Date(value).toISOString(),
        callbackTriggered: false,
      });
      toast.success("Callback rescheduled");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setBusyId(null);
    }
  };

  const cancelCallback = async (guestId: string) => {
    setBusyId(guestId);
    try {
      await api.updateGuest(token, guestId, {
        followUpStatus: "NONE",
        callbackAt: null,
        callbackTriggered: false,
      });
      toast.success("Scheduled callback cancelled");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = (guestId: string, status: FollowUpStatus) => {
    if (status === "NONE") {
      setClearFollowUpGuestId(guestId);
      return;
    }
    void updateStatus(guestId, status);
  };

  if (!eventsLoaded || eventsLoading || loading) {
    return <DashboardPageSkeleton variant="follow-up" cards={8} />;
  }

  return (
    <DashboardPage
      title="Follow-ups"
      description="Guests who asked for a callback or couldn't be reached by phone."
      actions={
        <Button variant="outline" render={<Link href="/guests" />} nativeButton={false}>
          All guests
        </Button>
      }
    >
      {guests.length > 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {guests.length} follow-up{guests.length === 1 ? "" : "s"}
          {scheduledCallbacks.length > 0
            ? ` · ${scheduledCallbacks.length} scheduled`
            : ""}
        </p>
      ) : null}

      {scheduledCallbacks.length > 0 ? (
        <section className="mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Scheduled callbacks ({scheduledCallbacks.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scheduledCallbacks.map((guest) => (
              <ScheduledCallbackCard
                key={guest.id}
                guest={guest}
                busy={busyId === guest.id}
                canWrite={canWrite}
                canTriggerVoice={canTriggerVoice}
                onCallNow={(guestId) => void callNow(guestId)}
                onReschedule={(g, value) => void reschedule(g, value)}
                onCancel={() => setCancelCallbackGuestId(guest.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        {scheduledCallbacks.length > 0 && otherFollowUps.length > 0 ? (
          <h2 className="text-sm font-semibold text-foreground">Other follow-ups</h2>
        ) : null}
        {otherFollowUps.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherFollowUps.map((guest) => (
              <FollowUpGuestCard
                key={guest.id}
                guest={guest}
                currentEventId={currentEventId}
                busy={busyId === guest.id}
                canWrite={canWrite}
                canTriggerVoice={canTriggerVoice}
                onStatusChange={handleStatusChange}
                onCallNow={(guestId) => void callNow(guestId)}
              />
            ))}
          </div>
        ) : !scheduledCallbacks.length ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-surface-container-low text-primary">
              <Users className="size-6" />
            </span>
            <p className="mt-4 text-sm font-medium text-foreground">No follow-ups right now</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Mark follow-up status on the guest list or schedule callbacks from voice calls.
            </p>
            <Button
              className="mt-5"
              variant="outline"
              render={<Link href="/guests" />}
              nativeButton={false}
            >
              Open guests
            </Button>
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={Boolean(cancelCallbackGuestId)}
        onOpenChange={(open) => !open && setCancelCallbackGuestId(null)}
        title="Cancel scheduled callback?"
        description="The guest will be removed from the callback queue. You can schedule again later from this list."
        confirmLabel="Cancel callback"
        variant="destructive"
        loading={busyId === cancelCallbackGuestId}
        onConfirm={async () => {
          if (!cancelCallbackGuestId) return;
          await cancelCallback(cancelCallbackGuestId);
          setCancelCallbackGuestId(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(clearFollowUpGuestId)}
        onOpenChange={(open) => !open && setClearFollowUpGuestId(null)}
        title="Clear follow-up?"
        description="This guest will be removed from the follow-up list until you mark them again."
        confirmLabel="Clear follow-up"
        variant="destructive"
        loading={busyId === clearFollowUpGuestId}
        onConfirm={async () => {
          if (!clearFollowUpGuestId) return;
          await updateStatus(clearFollowUpGuestId, "NONE");
          setClearFollowUpGuestId(null);
        }}
      />
    </DashboardPage>
  );
}
