"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Car } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type CabRecord } from "@/lib/api";
import { useEventAccess } from "@/hooks/use-event-access";

export default function DriversViewPage() {
  const { token, currentEventId } = useApp();
  const { canManageOperations } = useEventAccess();
  const [cabs, setCabs] = useState<CabRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentEventId) {
      setCabs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCabs(await api.listCabs(token, currentEventId));
    } catch {
      toast.error("Could not load cabs");
    } finally {
      setLoading(false);
    }
  }, [currentEventId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-md space-y-4 p-4 pb-8">
      <div>
        <h1 className="text-xl font-semibold">Driver roster</h1>
        <p className="text-sm text-muted-foreground">Cab capacity and assigned riders for today.</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {cabs.map((cab) => (
            <div key={cab.id} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold">{cab.vehicleNumber}</p>
              <p className="text-sm text-muted-foreground">
                {cab.driverName}
                {cab.driverPhone ? ` · ${cab.driverPhone}` : ""}
              </p>
              {cab.pickupTime ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Pickup {new Date(cab.pickupTime).toLocaleString()}
                </p>
              ) : null}
              <p className="mt-2 text-sm">
                Seats {cab.usedSeats}/{cab.capacity}
                {cab.routeZone ? ` · ${cab.routeZone}` : ""}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {(cab.assignments || []).map((assignment) => (
                  <li key={assignment.id} className="rounded-md bg-surface-container-low px-2 py-1">
                    {assignment.guest.name} (×{assignment.guest.groupSize})
                  </li>
                ))}
                {!cab.assignments?.length ? (
                  <li className="text-muted-foreground">No riders assigned</li>
                ) : null}
              </ul>
            </div>
          ))}
          {!cabs.length ? (
            <p className="text-center text-sm text-muted-foreground">No cabs configured for this event.</p>
          ) : null}
        </div>
      )}

      {canManageOperations ? (
        <Button className="w-full gap-2" render={<Link href="/operations" />} nativeButton={false}>
          <Car className="size-4" />
          Manage cabs
        </Button>
      ) : null}
    </main>
  );
}
