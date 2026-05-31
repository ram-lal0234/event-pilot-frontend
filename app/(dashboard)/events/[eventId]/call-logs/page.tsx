"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, FileAudio, MessageSquareText, PhoneCall, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type GuestCallLogEntry, type GuestCallLogs, type GuestRecord } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

export default function CallLogsPage() {
  const { token, currentEventId, currentEvent, eventsLoaded, eventsLoading } = useApp();
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [guestsLoaded, setGuestsLoaded] = useState(false);
  const [activeGuestId, setActiveGuestId] = useState<string>("");
  const [activeLogs, setActiveLogs] = useState<GuestCallLogs | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!currentEventId) return;
    setGuestsLoaded(false);
    api
      .listGuests(token, currentEventId)
      .then((result) => {
        setGuests(result);
        if (!activeGuestId && result.length) {
          setActiveGuestId(result[0].id);
        }
      })
      .catch(() => toast.error("We couldn't load guests right now."))
      .finally(() => setGuestsLoaded(true));
  }, [activeGuestId, currentEventId, token]);

  const loadLogs = async (guestId: string) => {
    if (!guestId) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const result = await api.getGuestCallLogs(token, guestId);
      setActiveLogs(result);
    } catch {
      setLogsError("We couldn't load call history right now.");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (!activeGuestId) return;
    void loadLogs(activeGuestId);
  }, [activeGuestId]);

  const filteredGuests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return guests;
    return guests.filter((guest) =>
      [guest.name, guest.phone, guest.email || ""].join(" ").toLowerCase().includes(normalized)
    );
  }, [guests, query]);

  const loading = !eventsLoaded || eventsLoading || !guestsLoaded;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Skeleton className="h-[65vh] w-full rounded-xl" />
          <Skeleton className="h-[65vh] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">Call Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review phone call history for guests in {currentEvent?.name || "this event"}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-card p-3">
          <div className="mb-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search guests..."
              aria-label="Search guests for call logs"
            />
          </div>
          <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
            {filteredGuests.map((guest) => (
              <button
                key={guest.id}
                type="button"
                onClick={() => setActiveGuestId(guest.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  activeGuestId === guest.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-surface-container-low"
                }`}
              >
                <p className="font-medium">{guest.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{guest.phone}</p>
              </button>
            ))}
            {!filteredGuests.length ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">No guests match this search.</p>
            ) : null}
          </div>
        </aside>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {activeLogs?.guest.name || "Select a guest"}
              </p>
              {activeLogs ? (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-[11px]">
                    {activeLogs.summary.totalCalls} calls
                  </Badge>
                  <Badge variant="secondary" className="text-[11px]">
                    {activeLogs.summary.totalIvrLogs} keypad logs
                  </Badge>
                  {activeLogs.summary.latestStatus ? (
                    <Badge variant={activeLogs.summary.latestStatus.toLowerCase().includes("error") ? "destructive" : "outline"} className="text-[11px]">
                      {activeLogs.summary.latestStatus}
                    </Badge>
                  ) : null}
                  {activeLogs.summary.lastVoiceResponseAt ? (
                    <Badge variant="outline" className="text-[11px]">
                      Last response: {new Date(activeLogs.summary.lastVoiceResponseAt).toLocaleTimeString()}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="gap-2"
              disabled={!activeGuestId}
              onClick={() => void loadLogs(activeGuestId)}
              loading={logsLoading}
              loadingText="Refreshing"
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>

          {logsError ? <p className="text-sm text-destructive">{logsError}</p> : null}
          {!logsLoading && !logsError && activeLogs && !activeLogs.timeline.length ? (
            <p className="text-sm text-muted-foreground">No voice call logs yet.</p>
          ) : null}
          <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
            {activeLogs?.timeline.map((entry) => (
              <CallLogItem key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "Unknown time";
  return new Date(value).toLocaleString();
}

function formatEntryTitle(entry: GuestCallLogEntry) {
  if (entry.type === "rsvp") return entry.outcome ? `RSVP ${entry.outcome}` : "RSVP captured";
  if (entry.type === "transcript") return "Transcript received";
  if (entry.type === "call_status") return `Call ${entry.status || "status"}`;
  if (entry.type === "error") return "Call error";
  return entry.eventName || entry.status || entry.type;
}

function renderCallLogIcon(entry: GuestCallLogEntry) {
  if (entry.type === "transcript") return <FileAudio className="size-4" />;
  if (entry.type === "rsvp") return <MessageSquareText className="size-4" />;
  return <PhoneCall className="size-4" />;
}

function CallLogItem({ entry }: { entry: GuestCallLogEntry }) {
  const isError = entry.type === "error" || (entry.status || "").toLowerCase().includes("error");

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-md bg-surface-container-low p-1.5 text-muted-foreground">
          {renderCallLogIcon(entry)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{formatEntryTitle(entry)}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              {formatDateTime(entry.at)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {entry.source.replace("_", " ")}
            {entry.callUuid ? ` · ${entry.callUuid.slice(0, 8)}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.rsvpStatus ? (
              <Badge
                variant={entry.rsvpStatus === "CONFIRMED" ? "secondary" : entry.rsvpStatus === "DECLINED" ? "outline" : "outline"}
                className={entry.rsvpStatus === "CONFIRMED" ? "bg-status-success-bg text-status-success" : entry.rsvpStatus === "DECLINED" ? "bg-status-error-bg text-status-error" : ""}
              >
                RSVP {entry.rsvpStatus}
              </Badge>
            ) : null}
            {entry.groupSize ? <Badge variant="outline">Group {entry.groupSize}</Badge> : null}
            {entry.needsCab === true ? (
              <Badge variant="outline" className="bg-status-warning-bg text-status-warning">Cab needed</Badge>
            ) : entry.needsCab === false ? (
              <Badge variant="outline">No cab</Badge>
            ) : null}
            {entry.needsHotel === true ? (
              <Badge variant="outline" className="bg-status-warning-bg text-status-warning">Hotel needed</Badge>
            ) : entry.needsHotel === false ? (
              <Badge variant="outline">No hotel</Badge>
            ) : null}
            {entry.language ? <Badge variant="outline">Language {entry.language}</Badge> : null}
            {isError ? <Badge variant="destructive">Needs attention</Badge> : null}
          </div>
          {entry.pickupLocation || entry.guestNotes ? (
            <p className="mt-2 rounded-md bg-surface-container-low px-2 py-1.5 text-sm text-foreground">
              {[entry.pickupLocation, entry.guestNotes].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {entry.transcription ? (
            <p className="mt-2 rounded-md bg-surface-container-low p-2 text-sm text-foreground">
              {entry.transcription}
            </p>
          ) : null}
          {entry.recordingUrl ? (
            <a
              href={entry.recordingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
            >
              Open recording
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
