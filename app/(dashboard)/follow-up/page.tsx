"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PhoneForwarded } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type GuestRecord } from "@/lib/api";

const ACTIVE_FOLLOW_UP =
  "NEEDS_FOLLOW_UP,CALLBACK_LATER,NO_ANSWER,VOICEMAIL";

export default function FollowUpPage() {
  const { token, currentEventId, eventsLoaded, eventsLoading } = useApp();
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      toast.error("Could not load follow-up queue");
    } finally {
      setLoading(false);
    }
  }, [currentEventId, token]);

  useEffect(() => {
    void load();
  }, [load]);

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

  if (!eventsLoaded || eventsLoading || loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PhoneForwarded className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Follow-up queue</h1>
            <p className="text-sm text-muted-foreground">
              Guests who need a callback or could not be reached on voice.
            </p>
          </div>
        </div>
        <Button variant="outline" render={<Link href="/guests" />} nativeButton={false}>
          All guests
        </Button>
      </div>

      <div className="space-y-3">
        {guests.map((guest) => (
          <div
            key={guest.id}
            className="rounded-xl border border-border bg-card p-4"
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
                className="w-full sm:w-52"
                value={guest.followUpStatus || "NEEDS_FOLLOW_UP"}
                disabled={busyId === guest.id}
                onChange={(event) =>
                  void updateStatus(
                    guest.id,
                    event.target.value as NonNullable<GuestRecord["followUpStatus"]>,
                  )
                }
              >
                <option value="NEEDS_FOLLOW_UP">Needs follow-up</option>
                <option value="CALLBACK_LATER">Callback later</option>
                <option value="NO_ANSWER">No answer</option>
                <option value="VOICEMAIL">Voicemail</option>
                <option value="COMPLETED">Completed</option>
                <option value="NONE">Clear</option>
              </Select>
            </div>
          </div>
        ))}
        {!guests.length ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No guests in the follow-up queue. Use voice calls or edit a guest to set follow-up status.
          </p>
        ) : null}
      </div>
    </div>
  );
}
