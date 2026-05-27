"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, type AuthUser, type EventRecord } from "@/lib/api";
import { LoginScreen } from "@/components/auth/login-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AppContextValue = {
  token: string;
  user: AuthUser;
  events: EventRecord[];
  currentEvent: EventRecord | null;
  currentEventId: string;
  eventsLoading: boolean;
  eventsLoaded: boolean;
  setCurrentEventId: (id: string) => void;
  refreshEvents: () => Promise<void>;
  createEvent: (payload: { name: string; date: string; location: string }) => Promise<EventRecord>;
  logout: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const TOKEN_KEY = "eventpilot.token";
const USER_KEY = "eventpilot.user";
const EVENT_KEY = "eventpilot.currentEventId";

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return value;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [currentEventId, setCurrentEventIdState] = useState("");

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      if (!active) return;

      const storedToken = window.localStorage.getItem(TOKEN_KEY);
      const storedUser = window.localStorage.getItem(USER_KEY);
      const storedEventId = window.localStorage.getItem(EVENT_KEY) || "";

      setToken(storedToken);
      try {
        setUser(storedUser ? (JSON.parse(storedUser) as AuthUser) : null);
      } catch {
        window.localStorage.removeItem(USER_KEY);
        setUser(null);
      }
      setCurrentEventIdState(storedEventId);
      setAuthReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(EVENT_KEY);
    setToken(null);
    setUser(null);
    setEvents([]);
    setEventsLoading(false);
    setEventsLoaded(false);
    setCurrentEventIdState("");
  }, []);

  const refreshEvents = useCallback(async () => {
    if (!token) {
      setEvents([]);
      setEventsLoaded(false);
      return;
    }

    setEventsLoading(true);
    try {
      const nextEvents = await api.listEvents(token);
      setEvents(nextEvents);
      setCurrentEventIdState((existing) => {
        const stored = window.localStorage.getItem(EVENT_KEY);
        const preferred = existing || stored || nextEvents[0]?.id || "";
        const next = nextEvents.some((event) => event.id === preferred)
          ? preferred
          : nextEvents[0]?.id || "";
        if (next) {
          window.localStorage.setItem(EVENT_KEY, next);
        } else {
          window.localStorage.removeItem(EVENT_KEY);
        }
        return next;
      });
      setEventsLoaded(true);
    } finally {
      setEventsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void Promise.resolve().then(() =>
      refreshEvents().catch((error) => {
        if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
          logout();
        }
      })
    );
  }, [logout, refreshEvents, token]);

  const setCurrentEventId = useCallback((id: string) => {
    setCurrentEventIdState(id);
    window.localStorage.setItem(EVENT_KEY, id);
  }, []);

  const createEvent = useCallback(
    async (payload: { name: string; date: string; location: string }) => {
      if (!token) throw new Error("Missing token");
      const event = await api.createEvent(token, payload);
      await refreshEvents();
      setCurrentEventId(event.id);
      return event;
    },
    [refreshEvents, setCurrentEventId, token]
  );

  const currentEvent = useMemo(
    () => events.find((event) => event.id === currentEventId) || events[0] || null,
    [currentEventId, events]
  );

  if (!authReady) {
    return null;
  }

  if (!token || !user) {
    return (
      <LoginScreen
        onAuthenticated={({ accessToken, user: authedUser }) => {
          window.localStorage.setItem(TOKEN_KEY, accessToken);
          window.localStorage.setItem(USER_KEY, JSON.stringify(authedUser));
          setEvents([]);
          setEventsLoaded(false);
          setToken(accessToken);
          setUser(authedUser);
          router.replace("/");
        }}
      />
    );
  }

  const value: AppContextValue = {
    token,
    user,
    events,
    currentEvent,
    currentEventId: currentEvent?.id || currentEventId,
    eventsLoading,
    eventsLoaded,
    setCurrentEventId,
    refreshEvents,
    createEvent,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function EmptyEventState() {
  const { createEvent, logout } = useApp();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await createEvent({ name, date, location });
      toast.success("Event created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm" onSubmit={submit}>
        <div className="mb-5 flex items-center gap-3">
          <CalendarPlus className="size-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Create your first event</h1>
            <p className="text-sm text-muted-foreground">This becomes the active workspace.</p>
          </div>
        </div>
        <div className="space-y-3">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Event name" required />
          <Input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} required />
          <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" required />
        </div>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" type="submit" loading={busy} loadingText="Creating event">
            Create Event
          </Button>
          <Button variant="outline" type="button" onClick={logout}>
            Logout
          </Button>
        </div>
      </form>
    </main>
  );
}
