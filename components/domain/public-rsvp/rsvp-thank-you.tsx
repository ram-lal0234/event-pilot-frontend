"use client";

import { CalendarPlus, CheckCircle2, Download, MapPin } from "lucide-react";
import type { EventRecord, RsvpStatus } from "@/lib/api";
import {
  buildGoogleCalendarUrl,
  downloadIcsFile,
  formatEventDateTime,
} from "@/lib/calendar-links";
import { Button } from "@/components/ui/button";

const RSVP_LABELS: Record<RsvpStatus, string> = {
  CONFIRMED: "Attending",
  PENDING: "Maybe / Pending",
  DECLINED: "Not attending",
};

export type RsvpThankYouSummary = {
  guestName: string;
  rsvpStatus: RsvpStatus;
  groupSize: number;
  needsCab: boolean;
  needsHotel: boolean;
};

export function RsvpThankYou({
  event,
  summary,
  onEdit,
}: {
  event: EventRecord;
  summary: RsvpThankYouSummary;
  onEdit?: () => void;
}) {
  const responseLine =
    summary.rsvpStatus === "CONFIRMED"
      ? `${RSVP_LABELS[summary.rsvpStatus]} (${summary.groupSize})`
      : RSVP_LABELS[summary.rsvpStatus];

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-12 text-status-success" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          आपका RSVP दर्ज हो गया!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your RSVP has been recorded.</p>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">{event.name}</h2>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <CalendarPlus className="mt-0.5 size-4 shrink-0" />
          {formatEventDateTime(event.date)}
        </p>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          {event.location}
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Hi {summary.guestName} — your response: </span>
          <span className="font-medium text-foreground">{responseLine}</span>
        </p>
        {(summary.needsCab || summary.needsHotel) && (
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {summary.needsCab ? <li>Cab pickup requested</li> : null}
            {summary.needsHotel ? <li>Hotel accommodation requested</li> : null}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="min-h-11 flex-1 gap-2"
          render={
            <a
              href={buildGoogleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          nativeButton={false}
        >
          <CalendarPlus className="size-4" />
          Add to Google Calendar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 flex-1 gap-2"
          onClick={() => downloadIcsFile(event)}
        >
          <Download className="size-4" />
          Download .ics
        </Button>
      </div>

      {onEdit ? (
        <Button type="button" variant="ghost" className="w-full min-h-11" onClick={onEdit}>
          Change my response
        </Button>
      ) : null}
    </main>
  );
}
