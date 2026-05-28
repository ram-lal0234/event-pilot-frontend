"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarPlus, MapPin, Settings, Users } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { CreateEventSheet } from "@/components/domain/events/create-event-sheet";
import {
  DashboardPage,
  DashboardPageSkeleton,
} from "@/components/layout/dashboard-page";
import { Button } from "@/components/ui/button";
import { scopedEventHref } from "@/lib/design-tokens";
import { eventStatusLabel, getEventTimeStatus } from "@/lib/event-status";
import type { EventRecord } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function EventsPage() {
  const { events, eventsLoading, eventsLoaded, setCurrentEventId } = useApp();
  const { isOwner } = useEventAccess();

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events],
  );

  if (!eventsLoaded || eventsLoading) {
    return <DashboardPageSkeleton cards={3} />;
  }

  return (
    <DashboardPage
      title="Events"
      description="All events you can access in this workspace."
      actions={
        isOwner ? (
          <CreateEventSheet
            trigger={
              <Button className="gap-2" type="button">
                <CalendarPlus className="size-4" />
                New event
              </Button>
            }
          />
        ) : undefined
      }
    >
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No events yet.</p>
          {isOwner ? (
            <CreateEventSheet
              trigger={
                <Button className="mt-4 gap-2" type="button">
                  <CalendarPlus className="size-4" />
                  Create your first event
                </Button>
              }
            />
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((event) => (
            <EventCard key={event.id} event={event} onOpen={() => setCurrentEventId(event.id)} />
          ))}
        </div>
      )}
    </DashboardPage>
  );
}

function EventCard({ event, onOpen }: { event: EventRecord; onOpen: () => void }) {
  const status = getEventTimeStatus(event.date);
  const dateLabel = new Date(event.date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold leading-snug text-foreground">{event.name}</h2>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            status === "active" && "bg-status-success-bg text-status-success",
            status === "upcoming" && "bg-surface-container-low text-foreground",
            status === "past" && "bg-muted text-muted-foreground",
          )}
        >
          {eventStatusLabel[status]}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        <span className="truncate">{event.location}</span>
      </p>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="size-3.5" />
        {event.guestCount ?? 0} guests · {event.rsvpConfirmedCount ?? 0} confirmed RSVP
      </p>
      <div className="mt-4 flex gap-2">
        <Button
          className="flex-1"
          size="sm"
          render={
            <Link href={scopedEventHref(event.id, "/")} onClick={() => onOpen()} />
          }
          nativeButton={false}
        >
          Open
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled
          title="Event settings coming soon"
        >
          <Settings className="size-4" />
          Settings
        </Button>
      </div>
    </article>
  );
}
