export type EventTimeStatus = "upcoming" | "active" | "past";

export function getEventTimeStatus(dateIso: string, now = new Date()): EventTimeStatus {
  const eventDate = new Date(dateIso);
  const start = new Date(eventDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(eventDate);
  end.setHours(23, 59, 59, 999);

  if (now > end) return "past";
  if (now < start) return "upcoming";
  return "active";
}

export const eventStatusLabel: Record<EventTimeStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  past: "Past",
};
