import type { GuestRecord, RsvpStatus } from "@/lib/api";

export type RealtimeGuestSnapshot = Pick<
  GuestRecord,
  | "id"
  | "eventId"
  | "name"
  | "phone"
  | "rsvpStatus"
  | "groupSize"
  | "followUpStatus"
  | "callbackAt"
>;

export type RealtimeCallHint = {
  id?: string;
  status?: string | null;
  callOutcome?: string | null;
  callUuid?: string | null;
};

export type RealtimeMessage = {
  type: string;
  eventId?: string;
  accountId?: string;
  ts?: number;
  guest?: RealtimeGuestSnapshot;
  call?: RealtimeCallHint;
  callOutcome?: string;
  locationType?: string;
  method?: string;
};

export type RealtimeConnectionState =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "failed";

export function mergeGuestFromRealtime(
  existing: GuestRecord,
  snapshot: RealtimeGuestSnapshot,
): GuestRecord {
  return {
    ...existing,
    ...snapshot,
    rsvpStatus: (snapshot.rsvpStatus ?? existing.rsvpStatus) as RsvpStatus,
  };
}
