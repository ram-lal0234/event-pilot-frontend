"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  api,
  ApiError,
  type AccountInfo,
  type AccountMembership,
  type AuthUser,
  type EventRecord,
} from "@/lib/api";
import { LoginScreen } from "@/components/auth/login-screen";
import { CreateFirstEventScreen } from "@/components/onboarding/create-first-event-screen";
import { NoEventsAssignedScreen } from "@/components/onboarding/no-events-assigned-screen";
import { PlannerOnboardingOverlay } from "@/components/onboarding/planner-onboarding-overlay";
import { isAccountOwner } from "@/lib/event-access";
import { needsPlannerOnboarding } from "@/lib/onboarding";

type AppContextValue = {
  token: string;
  user: AuthUser;
  account: AccountInfo | null;
  membership: AccountMembership | null;
  needsOnboarding: boolean;
  events: EventRecord[];
  currentEvent: EventRecord | null;
  currentEventId: string;
  eventsLoading: boolean;
  eventsLoaded: boolean;
  accountLoading: boolean;
  setCurrentEventId: (id: string) => void;
  refreshEvents: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  completeOnboarding: (payload: {
    name: string;
    phone: string;
    workspaceName?: string;
  }) => Promise<void>;
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
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [membership, setMembership] = useState<AccountMembership | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
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
    setAccount(null);
    setMembership(null);
    setNeedsOnboarding(false);
    setEvents([]);
    setEventsLoading(false);
    setEventsLoaded(false);
    setAccountLoading(false);
    setCurrentEventIdState("");
  }, []);

  const applyAccountResult = useCallback(
    (result: {
      account: AccountInfo;
      membership: AccountMembership;
      needsOnboarding: boolean;
    }) => {
      setAccount(result.account);
      setMembership(result.membership);
      setNeedsOnboarding(result.needsOnboarding);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              accountId: result.account.id,
              memberId: result.membership.id,
              accountRole: result.membership.role,
              accountName: result.account.name,
            }
          : prev,
      );
    },
    [],
  );

  const refreshAccount = useCallback(async () => {
    if (!token) {
      setAccount(null);
      setMembership(null);
      setNeedsOnboarding(false);
      return;
    }

    setAccountLoading(true);
    try {
      const result = await api.getAccountMe(token);
      applyAccountResult(result);
    } finally {
      setAccountLoading(false);
    }
  }, [applyAccountResult, token]);

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
      Promise.all([refreshAccount(), refreshEvents()]).catch((error) => {
        if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
          logout();
        }
      }),
    );
  }, [logout, refreshAccount, refreshEvents, token]);

  const setCurrentEventId = useCallback((id: string) => {
    setCurrentEventIdState(id);
    window.localStorage.setItem(EVENT_KEY, id);
  }, []);

  const completeOnboarding = useCallback(
    async (payload: { name: string; phone: string; workspaceName?: string }) => {
      if (!token) throw new Error("Missing token");
      const result = await api.completeOnboarding(token, payload);
      applyAccountResult(result);
    },
    [applyAccountResult, token],
  );

  const createEvent = useCallback(
    async (payload: { name: string; date: string; location: string }) => {
      if (!token) throw new Error("Missing token");
      const event = await api.createEvent(token, payload);
      await refreshEvents();
      setCurrentEventId(event.id);
      return event;
    },
    [refreshEvents, setCurrentEventId, token],
  );

  const currentEvent = useMemo(
    () => events.find((event) => event.id === currentEventId) || events[0] || null,
    [currentEventId, events],
  );

  const isOwner = isAccountOwner(membership?.role ?? user?.accountRole);
  const bootstrapping = Boolean(token && (!eventsLoaded || accountLoading));

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

  if (bootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading workspace…
      </main>
    );
  }

  if (needsPlannerOnboarding(membership) || needsOnboarding) {
    return <PlannerOnboardingOverlay />;
  }

  if (eventsLoaded && isOwner && events.length === 0) {
    return <CreateFirstEventScreen />;
  }

  if (eventsLoaded && !isOwner && events.length === 0) {
    return <NoEventsAssignedScreen />;
  }

  const value: AppContextValue = {
    token,
    user,
    account,
    membership,
    needsOnboarding,
    events,
    currentEvent,
    currentEventId: currentEvent?.id || currentEventId,
    eventsLoading,
    eventsLoaded,
    accountLoading,
    setCurrentEventId,
    refreshEvents,
    refreshAccount,
    completeOnboarding,
    createEvent,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
