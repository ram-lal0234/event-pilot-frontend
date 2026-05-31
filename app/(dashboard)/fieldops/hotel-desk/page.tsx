"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bed } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type GuestRecord } from "@/lib/api";
import { useEventAccess } from "@/hooks/use-event-access";

export default function HotelDeskPage() {
  const { token, currentEventId } = useApp();
  const { canManageOperations } = useEventAccess();
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
        pageSize: 80,
        needsHotel: "true",
      });
      setGuests(result.items);
    } catch {
      toast.error("Could not load hotel guests");
    } finally {
      setLoading(false);
    }
  }, [currentEventId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-md space-y-4 p-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Hotel desk</h1>
          <p className="text-sm text-muted-foreground">Guests who requested hotel accommodation.</p>
        </div>
        <Button size="sm" variant="outline" render={<Link href="/fieldops/checkin" />} nativeButton={false}>
          Hotel check-in
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {guests.map((guest) => {
            const hasRoom = Boolean(guest.roomAssignments?.length);
            const hotelCheckedIn = guest.checkins?.some((c) => c.locationType === "HOTEL");
            return (
              <div key={guest.id} className="rounded-xl border border-border bg-card p-3">
                <p className="font-medium">{guest.name}</p>
                <p className="text-xs text-muted-foreground">
                  Group {guest.groupSize}
                  {hasRoom ? " · Room assigned" : " · No room yet"}
                  {hotelCheckedIn ? " · Checked in at hotel" : ""}
                </p>
                {guest.guestNotes ? (
                  <p className="mt-1 text-xs text-muted-foreground">{guest.guestNotes}</p>
                ) : null}
              </div>
            );
          })}
          {!guests.length ? (
            <p className="text-center text-sm text-muted-foreground">No guests flagged for hotel.</p>
          ) : null}
        </div>
      )}

      {canManageOperations ? (
        <Button className="w-full gap-2" render={<Link href="/operations" />} nativeButton={false}>
          <Bed className="size-4" />
          Room assignments
        </Button>
      ) : null}
    </main>
  );
}
