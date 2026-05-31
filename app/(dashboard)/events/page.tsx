"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, CalendarPlus, MapPin, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { CreateEventSheet } from "@/components/domain/events/create-event-sheet";
import { EventSettingsSheet } from "@/components/domain/events/event-settings-sheet";
import {
  DashboardPage,
  DashboardPageSkeleton,
} from "@/components/layout/dashboard-page";
import { Button } from "@/components/ui/button";
import { scopedEventHref } from "@/lib/design-tokens";
import { eventStatusLabel, getEventTimeStatus } from "@/lib/event-status";
import type { EventRecord } from "@/lib/api";
import { api } from "@/lib/api";
import { canWriteEvent } from "@/lib/event-access";
import { cn } from "@/lib/utils";

export default function EventsPage() {
  const { events, eventsLoading, eventsLoaded, setCurrentEventId, user, token, refreshEvents } =
    useApp();
  const { isOwner } = useEventAccess();
  const [showArchived, setShowArchived] = useState(false);
  const [archivedEvents, setArchivedEvents] = useState<EventRecord[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  const loadArchived = useCallback(async () => {
    if (!isOwner) return;
    setArchivedLoading(true);
    try {
      setArchivedEvents(await api.listArchivedEvents(token));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load archived events");
    } finally {
      setArchivedLoading(false);
    }
  }, [isOwner, token]);

  useEffect(() => {
    if (showArchived && isOwner) {
      void loadArchived();
    }
  }, [showArchived, isOwner, loadArchived]);

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events],
  );

  const sortedArchived = useMemo(
    () =>
      [...archivedEvents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [archivedEvents],
  );

  if (!eventsLoaded || eventsLoading) {
    return <DashboardPageSkeleton cards={3} />;
  }

  return (
    <DashboardPage
      title="Events"
      description="All events you can access in this workspace."
      actions={
        <div className="flex flex-wrap gap-2">
          {isOwner ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowArchived((value) => !value)}
            >
              {showArchived ? "Hide archived" : "Show archived"}
            </Button>
          ) : null}
          {isOwner ? (
            <CreateEventSheet
              trigger={
                <Button className="gap-2" type="button">
                  <CalendarPlus className="size-4" />
                  New event
                </Button>
              }
            />
          ) : undefined}
        </div>
      }
    >
      {sorted.length === 0 && !showArchived ? (
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
            <EventCard
              key={event.id}
              event={event}
              canWrite={canWriteEvent(user.accountRole, event)}
              isOwner={isOwner}
              archived={false}
              onOpen={() => setCurrentEventId(event.id)}
              onArchive={async () => {
                if (
                  !window.confirm(
                    `Archive "${event.name}"? Team members will lose access until you restore it.`,
                  )
                ) {
                  return;
                }
                try {
                  await api.archiveEvent(token, event.id);
                  toast.success("Event archived");
                  await refreshEvents();
                  if (showArchived) await loadArchived();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not archive event");
                }
              }}
            />
          ))}
        </div>
      )}

      {showArchived && isOwner ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Archived events
          </h2>
          {archivedLoading ? (
            <p className="text-sm text-muted-foreground">Loading archived events…</p>
          ) : sortedArchived.length === 0 ? (
            <p className="text-sm text-muted-foreground">No archived events.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedArchived.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  canWrite={false}
                  isOwner={isOwner}
                  archived
                  onOpen={() => setCurrentEventId(event.id)}
                  onRestore={async () => {
                    try {
                      await api.restoreEvent(token, event.id);
                      toast.success("Event restored");
                      await refreshEvents();
                      await loadArchived();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not restore event");
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </DashboardPage>
  );
}

function EventCard({
  event,
  canWrite,
  isOwner,
  archived,
  onOpen,
  onArchive,
  onRestore,
}: {
  event: EventRecord;
  canWrite: boolean;
  isOwner: boolean;
  archived: boolean;
  onOpen: () => void;
  onArchive?: () => Promise<void>;
  onRestore?: () => Promise<void>;
}) {
  const status = getEventTimeStatus(event.date);
  const dateLabel = new Date(event.date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm",
        archived && "opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold leading-snug text-foreground">{event.name}</h2>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            archived && "bg-muted text-muted-foreground",
            !archived && status === "active" && "bg-status-success-bg text-status-success",
            !archived && status === "upcoming" && "bg-surface-container-low text-foreground",
            !archived && status === "past" && "bg-muted text-muted-foreground",
          )}
        >
          {archived ? "Archived" : eventStatusLabel[status]}
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
      <div className="mt-4 flex flex-wrap gap-2">
        {!archived ? (
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
        ) : null}
        {!archived && canWrite ? (
          <EventSettingsSheet
            eventId={event.id}
            canWrite={canWrite}
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                type="button"
                onClick={() => onOpen()}
              >
                <Settings className="size-4" />
                Settings
              </Button>
            }
          />
        ) : null}
        {isOwner && !archived && onArchive ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={() => void onArchive()}
          >
            <Archive className="size-4" />
            Archive
          </Button>
        ) : null}
        {isOwner && archived && onRestore ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => void onRestore()}
          >
            <ArchiveRestore className="size-4" />
            Restore
          </Button>
        ) : null}
      </div>
    </article>
  );
}
