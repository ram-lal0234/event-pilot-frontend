"use client";

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
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  CalendarPlus,
  Clock3,
  HelpCircle,
  MailCheck,
  Rocket,
  Shield,
  Sparkles,
} from "lucide-react";
import { api, ApiError, type AuthUser, type EventRecord } from "@/lib/api";
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
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const storedUser = window.localStorage.getItem(USER_KEY);
    return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
  });
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [currentEventId, setCurrentEventIdState] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem(EVENT_KEY) || ""
  );

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

function LoginScreen({
  onAuthenticated,
}: {
  onAuthenticated: (result: { accessToken: string; user: AuthUser }) => void;
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api.requestOtp(email);
      setMessage(result.otp ? `Development OTP: ${result.otp}` : "OTP sent to email");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request OTP");
    } finally {
      setBusy(false);
    }
  };

  const updateOtpDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otp.padEnd(6, " ").split("");
    next[index] = digit || " ";
    setOtp(next.join("").trimEnd());
    if (digit) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api.verifyOtp(email, otp);
      onAuthenticated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify OTP");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="h-dvh overflow-hidden bg-[#0b1326] text-[#dae2fd]">
      <div className="flex h-full min-h-0">
        <BrandPanel compact={step === "otp"} />
        <section className="relative flex h-full min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-[#060e20] px-4 py-4 sm:px-6 lg:w-1/2">
          <div className="absolute left-4 top-4 flex items-center gap-3 sm:left-6 lg:hidden">
            <Rocket className="size-8 text-[#c3c0ff]" />
            <span className="text-xl font-bold text-[#c3c0ff]">EventPilot AI</span>
          </div>
          <Button
            className="absolute right-4 top-4 size-9 rounded-full border-white/10 bg-white/5 text-[#c7c4d8] hover:bg-white/10 sm:right-6 lg:hidden"
            variant="outline"
            size="icon"
            type="button"
            aria-label="Help"
          >
            <HelpCircle className="size-5" />
          </Button>
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(23,31,51,0.9),rgba(6,14,32,0.98)_45%,rgba(10,19,38,1))]" />

          {step === "email" ? (
            <form
              className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#171f33]/80 p-5 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl sm:p-6 md:p-8"
              onSubmit={requestOtp}
            >
              <div className="absolute left-1/2 top-0 h-px w-[90%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c3c0ff]/30 to-transparent" />
              <div className="mb-7">
                <h1 className="text-2xl font-semibold text-[#dae2fd] md:text-4xl">Welcome Back</h1>
                <p className="mt-2 text-base text-[#c7c4d8]">Login securely to manage your events</p>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-sm font-medium text-[#c7c4d8]" htmlFor="email">
                  Email Address
                </label>
                <div className="group relative">
                  <AtSign className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#918fa1] transition-colors group-focus-within:text-[#c3c0ff]" />
                  <Input
                    className="h-12 border-[#464555]/50 bg-black/20 pl-13 pr-4 text-[#dae2fd] placeholder:text-[#918fa1] focus-visible:border-[#c3c0ff] focus-visible:ring-[#c3c0ff]/20"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              {message && <p className="mt-4 rounded-lg border border-[#00a2e6]/20 bg-[#00a2e6]/10 p-3 text-sm text-[#89ceff]">{message}</p>}
              {error && <p className="mt-4 rounded-lg border border-[#ffb4ab]/20 bg-[#93000a]/30 p-3 text-sm text-[#ffb4ab]">{error}</p>}

              <Button
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-4 text-sm font-semibold text-[#dad7ff] shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                type="submit"
                disabled={busy}
              >
                Send OTP
                <ArrowRight className="size-4" />
              </Button>

              <AuthDivider label="OR CONTINUE WITH" />
              <Button
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-white px-4 text-sm font-semibold text-[#131b2e] transition-all hover:bg-neutral-100 active:scale-[0.98]"
                type="button"
              >
                <GoogleMark />
                Continue with Google
              </Button>

              <AuthFooter />
            </form>
          ) : (
            <form
              className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#171f33]/80 p-5 shadow-2xl backdrop-blur-2xl sm:p-6 md:p-8"
              onSubmit={verifyOtp}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c3c0ff]/30 to-transparent" />
              <Button
                variant="link"
                className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#c7c4d8] transition-colors hover:text-[#dae2fd]"
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
              >
                <ArrowLeft className="size-4" />
                Change email
              </Button>
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-[#c3c0ff]/20 bg-[#4f46e5]/20">
                  <MailCheck className="size-8 text-[#c3c0ff]" />
                </div>
                <h1 className="text-2xl font-semibold text-[#dae2fd] md:text-4xl">Verify Your Email</h1>
                <p className="mt-2 text-base text-[#c7c4d8]">Enter the 6-digit code sent to {email}</p>
              </div>

              <div className="flex justify-between gap-2 sm:gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    className="h-12 w-10 border-white/10 bg-black/20 p-0 text-center text-xl font-bold text-[#c3c0ff] focus-visible:border-[#c3c0ff] focus-visible:shadow-[0_0_15px_rgba(79,70,229,0.4)] focus-visible:ring-0 sm:h-14 sm:w-12 sm:text-2xl"
                    maxLength={1}
                    inputMode="numeric"
                    value={otp[index] || ""}
                    onChange={(event) => updateOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !otp[index]) {
                        document.getElementById(`otp-${index - 1}`)?.focus();
                      }
                    }}
                    onPaste={(event) => {
                      event.preventDefault();
                      setOtp(event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6));
                    }}
                  />
                ))}
              </div>

              {message && <p className="mt-4 rounded-lg border border-[#00a2e6]/20 bg-[#00a2e6]/10 p-3 text-sm text-[#89ceff]">{message}</p>}
              {error && <p className="mt-4 rounded-lg border border-[#ffb4ab]/20 bg-[#93000a]/30 p-3 text-sm text-[#ffb4ab]">{error}</p>}

              <Button
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-4 text-sm font-semibold text-[#dad7ff] transition-all hover:shadow-[0_0_20px_rgba(137,206,255,0.3)] active:scale-95 disabled:opacity-60"
                type="submit"
                disabled={busy || otp.length < 6}
              >
                Verify & Continue
                <ArrowRight className="size-4" />
              </Button>

              <div className="pt-5 text-center">
                <p className="flex items-center justify-center gap-1 text-sm text-[#c7c4d8]">
                  Did not receive the code?
                  <Button
                    variant="link"
                    className="h-auto p-0 font-semibold text-[#89ceff] hover:underline"
                    type="button"
                    onClick={() => setStep("email")}
                  >
                    Resend OTP
                  </Button>
                </p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold text-[#c7c4d8]/60">
                  <Clock3 className="size-3.5" />
                  Wait 0:59
                </p>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function BrandPanel({ compact }: { compact: boolean }) {
  return (
    <section
      className={
        compact
          ? "relative hidden h-full w-[400px] flex-col overflow-hidden border-r border-white/5 bg-[#131b2e]/80 p-10 backdrop-blur-2xl lg:flex"
          : "relative hidden h-full w-1/2 flex-col justify-between overflow-hidden bg-[#0b1326] p-12 xl:p-16 2xl:p-20 lg:flex"
      }
    >
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(79,70,229,0.14),rgba(19,27,46,0.7)_36%,rgba(11,19,38,1)_100%)]" />
      <div className="relative z-10">
        <div className="mb-8 flex items-center gap-2 xl:mb-12">
          <Rocket className="size-10 text-[#c3c0ff]" />
          <h1 className="text-3xl font-bold tracking-tight text-[#c3c0ff]">EventPilot AI</h1>
        </div>
        {compact ? (
          <>
            <p className="max-w-xs text-base text-[#c7c4d8]">The future of event management, powered by intelligence.</p>
            <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-6 xl:mt-20">
              <div className="mb-2 flex items-center gap-2 text-[#d0bcff]">
                <Sparkles className="size-5" />
                <span className="text-sm font-semibold">AI-Driven Precision</span>
              </div>
              <p className="text-sm text-[#c7c4d8]">Automated scheduling and attendee insights at your fingertips.</p>
            </div>
          </>
        ) : (
          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight text-[#dae2fd] xl:text-5xl">
              Manage Guests, Logistics & Check-ins Seamlessly
            </h2>
            <p className="mt-5 text-base leading-7 text-[#c7c4d8] xl:mt-6 xl:text-lg xl:leading-8">
              The future of event management, powered by intelligence. Optimize your workflow and elevate attendee experiences with real-time data insights.
            </p>
          </div>
        )}
      </div>
      {!compact && (
        <div className="relative z-10 flex gap-6">
          <FeatureKicker title="Next Gen" body="Cloud-native architecture" />
          <div className="h-8 w-px bg-[#464555]/40" />
          <FeatureKicker title="Secure" body="Enterprise-grade encryption" />
        </div>
      )}
    </section>
  );
}

function FeatureKicker({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col">
      <span className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#c3c0ff]">{title}</span>
      <span className="text-sm text-[#c7c4d8]">{body}</span>
    </div>
  );
}

function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center py-4">
      <div className="flex-grow border-t border-[#464555]/30" />
      <span className="mx-4 flex-shrink text-xs font-semibold uppercase tracking-widest text-[#464555]">{label}</span>
      <div className="flex-grow border-t border-[#464555]/30" />
    </div>
  );
}

function GoogleMark() {
  return (
    <span className="grid size-5 place-items-center rounded-full bg-white text-sm font-bold text-[#4285f4]">
      G
    </span>
  );
}

function AuthFooter() {
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <div className="flex gap-4 text-xs font-semibold text-[#918fa1]">
        <a className="transition-colors hover:text-[#dae2fd]" href="#">Privacy Policy</a>
        <span className="text-[#464555]/60">.</span>
        <a className="transition-colors hover:text-[#dae2fd]" href="#">Terms of Service</a>
      </div>
      <p className="text-xs text-[#c7c4d8]/60">© 2024 EventPilot AI. All rights reserved.</p>
      <div className="flex items-center gap-2 text-xs text-[#c7c4d8]/60">
        <Shield className="size-3.5" />
        Enterprise-grade encryption
      </div>
    </div>
  );
}

export function EmptyEventState() {
  const { createEvent, logout } = useApp();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createEvent({ name, date, location });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
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
        {error && <p className="mt-3 rounded-md bg-status-error-bg p-2 text-sm text-status-error">{error}</p>}
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" type="submit" disabled={busy}>Create Event</Button>
          <Button variant="outline" type="button" onClick={logout}>Logout</Button>
        </div>
      </form>
    </main>
  );
}
