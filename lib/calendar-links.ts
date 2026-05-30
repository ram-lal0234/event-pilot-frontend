import type { EventRecord } from "@/lib/api";

function formatIcsUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function formatEventDateTime(dateIso: string) {
  return new Date(dateIso).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function buildGoogleCalendarUrl(event: Pick<EventRecord, "name" | "date" | "location">) {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${formatIcsUtc(start)}/${formatIcsUtc(end)}`,
    details: "RSVP confirmed via EventPilot",
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsFileContent(event: Pick<EventRecord, "name" | "date" | "location">) {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const uid = `eventpilot-${start.getTime()}@eventpilot.ai`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventPilot//RSVP//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${event.name.replace(/[,;\\]/g, "")}`,
    `LOCATION:${event.location.replace(/[,;\\]/g, "")}`,
    "DESCRIPTION:RSVP confirmed via EventPilot",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(
  event: Pick<EventRecord, "name" | "date" | "location">,
  filename?: string,
) {
  const content = buildIcsFileContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || `${event.name.replace(/\s+/g, "-").toLowerCase()}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}
