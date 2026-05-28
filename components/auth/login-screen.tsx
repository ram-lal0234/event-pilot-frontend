"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  Sparkles,
} from "lucide-react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { LoginHeroMockup } from "@/components/auth/login-hero-mockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError, type AuthUser } from "@/lib/api";
import { brand, colors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailFormatErrorMessage(trimmed: string): string | null {
  if (!trimmed) return "Enter the email associated with your account.";
  if (!trimmed.includes("@"))
    return "Add an \"@\" between your name and provider—for example planner@gmail.com.";
  if (!EMAIL_RE.test(trimmed)) return "That email doesn’t look quite right. Check the spelling and domain.";
  return null;
}

function userFacingAuthMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) {
    const m = error.message.toLowerCase();
    if (
      error.name === "TypeError" ||
      m.includes("failed to fetch") ||
      m.includes("network error") ||
      m.includes("load failed")
    ) {
      return "We couldn’t reach the server. Check your connection and try again.";
    }
    return error.message;
  }
  return "Something went wrong. Try again.";
}

export type LoginScreenProps = {
  onAuthenticated: (result: { accessToken: string; user: AuthUser }) => void;
  initialEmail?: string;
  joinInviteCode?: string;
  lockEmail?: boolean;
};

export function LoginScreen({
  onAuthenticated,
  initialEmail = "",
  joinInviteCode,
  lockEmail = Boolean(joinInviteCode),
}: LoginScreenProps) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailFieldError, setEmailFieldError] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpCountdownSec, setOtpCountdownSec] = useState(0);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (step !== "otp") return;
    setOtpCountdownSec(8 * 60 + 9);
    const id = window.setInterval(() => {
      setOtpCountdownSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step]);

  const formatHms = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const otpCode = otp.replace(/\s/g, "");

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setEmailFieldError("");
    setMessage("");
    setError("");

    const trimmed = email.trim();
    const fmt = emailFormatErrorMessage(trimmed);
    if (fmt) {
      setEmailFieldError(fmt);
      return;
    }
    if (trimmed !== email) setEmail(trimmed);

    setBusy(true);
    try {
      const result = await api.requestOtp(trimmed);
      setMessage(
        result.otp ? `Development code: ${result.otp}` : "We sent a 6-digit code to your email.",
      );
      setStep("otp");
    } catch (err) {
      setError(userFacingAuthMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const updateOtpDigit = (index: number, value: string) => {
    setError("");
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otp.padEnd(6, " ").split("");
    next[index] = digit || " ";
    setOtp(next.join("").trimEnd());
    if (digit) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const applyOtpFromDigits = (digits: string) => {
    setError("");
    setOtp(digits);
    document.getElementById(`otp-${Math.min(digits.length, 5)}`)?.focus();
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (otpCode.length < 6) return;
    setBusy(true);
    setError("");
    try {
      const trimmedEmail = email.trim();
      const result = joinInviteCode
        ? await api.verifyJoinOtp(joinInviteCode, trimmedEmail, otpCode)
        : await api.verifyOtp(trimmedEmail, otpCode);
      onAuthenticated(result);
    } catch (err) {
      setError(userFacingAuthMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await api.requestOtp(email.trim());
      setMessage(result.otp ? `New development code: ${result.otp}` : "We sent another code.");
      setOtpCountdownSec(8 * 60 + 9);
    } catch (err) {
      setError(userFacingAuthMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const emailHasIssue = Boolean(emailFieldError || error);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#e8ecf4] px-4 py-8">
      <LoginPageBackdrop />

      <div className="relative z-10 flex w-full max-w-[980px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.28)] md:min-h-[580px]">
        <LoginBrandPanel step={step} />

        <section className="flex w-full flex-col bg-white md:w-[52%] lg:w-1/2">
          <header className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
            <Link href="/login" className="flex items-center gap-2.5">
              <div
                className="grid size-9 place-items-center rounded-lg text-white shadow-sm"
                style={{ backgroundColor: colors.primary }}
              >
                <Sparkles className="size-4" aria-hidden />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">{brand.name}</span>
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Help
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-10">
            {joinInviteCode ? (
              <p className="mb-5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center text-sm text-muted-foreground">
                Team invitation — sign in with the invited email to continue.
              </p>
            ) : null}

            {step === "email" ? (
              <form noValidate className="mx-auto w-full max-w-[360px] space-y-6" onSubmit={(e) => void requestOtp(e)}>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h1>
                  <p className="text-sm text-muted-foreground">
                    Use your work email. We&apos;ll send a one-time passcode — no password to remember.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Email or username"
                    value={email}
                    disabled={lockEmail || busy}
                    readOnly={lockEmail}
                    aria-invalid={emailHasIssue}
                    className={cn(
                      "h-12 rounded-xl border-border bg-[#fafbfc] text-base",
                      emailHasIssue && "border-destructive",
                    )}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailFieldError("");
                      setError("");
                    }}
                  />
                  {emailFieldError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {emailFieldError}
                    </p>
                  ) : null}
                  {error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  disabled={busy}
                  className="h-12 w-full gap-2 rounded-full text-base font-semibold text-white shadow-md"
                  style={{
                    background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryContainer} 55%, #7c3aed 100%)`,
                  }}
                >
                  {busy ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="size-5" />
                      Sign in
                    </>
                  )}
                </Button>

                <div className="relative flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full gap-2 rounded-full border-border bg-white text-base font-medium"
                  disabled
                  title="Google sign-in coming soon"
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
              </form>
            ) : (
              <form noValidate className="mx-auto w-full max-w-[360px] space-y-6" onSubmit={(e) => void verifyOtp(e)}>
                <div className="flex items-start gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 size-9 shrink-0 rounded-full"
                    aria-label="Back"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setMessage("");
                      setError("");
                    }}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to{" "}
                      <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>
                </div>

                <fieldset className="space-y-3">
                  <legend className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <KeyRound className="size-4 text-muted-foreground" />
                    One-time code
                  </legend>
                  <div className="flex justify-between gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        className="h-12 w-full max-w-[48px] rounded-xl border-border bg-[#fafbfc] p-0 text-center text-lg font-semibold"
                        maxLength={1}
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        value={otp[index] || ""}
                        onChange={(e) => updateOtpDigit(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[index]) {
                            document.getElementById(`otp-${index - 1}`)?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          applyOtpFromDigits(
                            e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6),
                          );
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock3 className="size-3.5" />
                      Resend in {formatHms(otpCountdownSec)}
                    </span>
                    <button
                      type="button"
                      className={cn(
                        "font-semibold",
                        otpCountdownSec > 0 || busy ? "pointer-events-none opacity-50" : "text-primary",
                      )}
                      style={{ color: otpCountdownSec === 0 && !busy ? colors.primary : undefined }}
                      disabled={otpCountdownSec > 0 || busy}
                      onClick={() => void resendOtp()}
                    >
                      Resend code
                    </button>
                  </div>
                  {message ? (
                    <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p>
                  ) : null}
                  {error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  ) : null}
                </fieldset>

                <Button
                  type="submit"
                  disabled={busy || otpCode.length < 6}
                  className="h-12 w-full gap-2 rounded-full text-base font-semibold text-white shadow-md"
                  style={{
                    background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryContainer} 55%, #7c3aed 100%)`,
                  }}
                >
                  {busy ? <Loader2 className="size-5 animate-spin" /> : null}
                  Continue
                  {!busy ? <ArrowRight className="size-5" /> : null}
                </Button>
              </form>
            )}
          </div>

          <footer className="mt-auto flex flex-col gap-3 border-t border-border/80 px-6 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <span>© {new Date().getFullYear()} {brand.name}</span>
            <nav className="flex gap-4">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </nav>
          </footer>
        </section>
      </div>
    </main>
  );
}

function LoginPageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#dce4f5_0%,#e8ecf4_45%,#e2e8f0_100%)]" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.4) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}

function LoginBrandPanel({ step }: { step: "email" | "otp" }) {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden p-8 text-white md:flex md:w-[48%] lg:w-1/2 lg:p-10"
      style={{
        background: `linear-gradient(145deg, ${colors.primary} 0%, #4338ca 42%, #312e81 100%)`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl"
      />

      <p className="relative z-10 max-w-xs text-sm leading-relaxed text-white/75">
        Event operations made simple — guests, RSVP, transport, hotels, and check-in in one place.
      </p>

      <div className="relative z-10 flex flex-1 flex-col justify-center py-6">
        <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
          {step === "email" ? "Manage your events" : "Almost there"}
        </h2>
        <p className="mt-3 max-w-sm text-sm text-white/70">
          {step === "email"
            ? "Plan weddings and corporate events with clarity from invite to last guest checkout."
            : "Enter the code we emailed you to access your workspace."}
        </p>
        <LoginHeroMockup />
      </div>

      <p className="relative z-10 text-xs text-white/50">Trusted by professional event planners</p>
    </aside>
  );
}
