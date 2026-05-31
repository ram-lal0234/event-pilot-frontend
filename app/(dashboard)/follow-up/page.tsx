"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import {
  DashboardPage,
  DashboardPageSkeleton,
} from "@/components/layout/dashboard-page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type GuestRecord } from "@/lib/api";
import { getVoiceCallErrorMessage, voiceCallModeCopy } from "@/lib/voice-messages";
import { formatCallbackAt } from "@/lib/format-callback-time";

const ACTIVE_FOLLOW_UP =
  "NEEDS_FOLLOW_UP,CALLBACK_LATER,NO_ANSWER,VOICEMAIL";

export default function FollowUpPage() {
  const { token, currentEventId, eventsLoaded, eventsLoading } = useApp();
  const { canWrite, canTriggerVoice } = useEventAccess();
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelCallbackGuestId, setCancelCallbackGuestId] = useState<string | null>(null);

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

  const updateStatus = async (
    guestId: string,
    followUpStatus: NonNullable<GuestRecord["followUpStatus"]>,
  ) => {
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

  if (!eventsLoaded || eventsLoading || loading) {
    return <DashboardPageSkeleton variant="list" cards={4} />;
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
      {scheduledCallbacks.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Scheduled callbacks ({scheduledCallbacks.length})
          </h2>
          {scheduledCallbacks.map((guest) => (
            <div
              key={guest.id}
              className="rounded-lg border border-primary/20 bg-card p-4"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-semibold">{guest.name}</p>
                  <p className="text-sm text-muted-foreground">{guest.phone}</p>
                  <p className="mt-1 text-sm font-medium text-primary">
                    {formatCallbackAt(guest.callbackAt)}
                    {guest.callbackTriggered ? " · call scheduled" : ""}
                  </p>
                  {guest.guestNotes ? (
                    <p className="mt-1 text-xs text-muted-foreground">{guest.guestNotes}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {canTriggerVoice ? (
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-11 gap-2"
                      disabled={busyId === guest.id || guest.rsvpStatus !== "PENDING"}
                      onClick={() => void callNow(guest.id)}
                    >
                      <PhoneCall className="size-4" />
                      Call now
                    </Button>
                  ) : null}
                  {canWrite ? (
                    <>
                      <Input
                        type="datetime-local"
                        className="min-h-11 sm:max-w-[220px]"
                        defaultValue={
                          guest.callbackAt
                            ? guest.callbackAt.slice(0, 16)
                            : ""
                        }
                        disabled={busyId === guest.id}
                        onBlur={(event) => {
                          if (event.target.value) {
                            void reschedule(guest, event.target.value);
                          }
                        }}
                        aria-label={`Reschedule callback for ${guest.name}`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-11"
                        disabled={busyId === guest.id}
                        onClick={() => setCancelCallbackGuestId(guest.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        {scheduledCallbacks.length > 0 ? (
          <h2 className="text-sm font-semibold text-foreground">Other follow-ups</h2>
        ) : null}
        {otherFollowUps.map((guest) => (
          <div
            key={guest.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">{guest.name}</p>
                <p className="text-sm text-muted-foreground">
                  {guest.phone}
                  {guest.email ? ` · ${guest.email}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  RSVP {guest.rsvpStatus}
                  {guest.guestNotes ? ` · ${guest.guestNotes}` : ""}
                </p>
              </div>
              <Select
                value={guest.followUpStatus || "NEEDS_FOLLOW_UP"}
                disabled={!canWrite || busyId === guest.id}
                onValueChange={(status) => {
                  if (status != null) {
                    void updateStatus(
                      guest.id,
                      status as NonNullable<GuestRecord["followUpStatus"]>,
                    );
                  }
                }}
              >
                <SelectTrigger className="w-full justify-between font-normal sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="NEEDS_FOLLOW_UP">Needs follow-up</SelectItem>
                  <SelectItem value="CALLBACK_LATER">Callback later</SelectItem>
                  <SelectItem value="NO_ANSWER">No answer</SelectItem>
                  <SelectItem value="VOICEMAIL">Voicemail</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="NONE">Clear</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        {!guests.length ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No guests need follow-up right now. Call a guest from the guest list or mark follow-up status manually.
          </p>
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
    </DashboardPage>
  );
}
