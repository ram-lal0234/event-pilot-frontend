"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Mail,
  Rocket,
  ScanLine,
  UserRoundCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError, type AuthUser } from "@/lib/api";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailFormatErrorMessage(trimmed: string): string | null {
  if (!trimmed) return "Enter the email associated with your account.";
  if (!trimmed.includes("@"))
    return "Add an \"@\" between your name and provider—for example deepak@gmail.com.";
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

type LoginScreenProps = {
  onAuthenticated: (result: { accessToken: string; user: AuthUser }) => void;
};

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailFieldError, setEmailFieldError] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpCountdownSec, setOtpCountdownSec] = useState(0);

  useEffect(() => {
    if (step !== "otp") return;
    setOtpCountdownSec(8 * 60 + 9);
    const id = window.setInterval(() => {
      setOtpCountdownSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step]);

  const formatHms = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  };

  const otpCode = otp.replace(/\s/g, "");

  const clearOtpAlerts = () => {
    setError("");
  };

  const applyOtpFromDigits = (digits: string) => {
    clearOtpAlerts();
    setOtp(digits);
    document.getElementById(`otp-${Math.min(digits.length, 5)}`)?.focus();
  };

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
        result.otp
          ? `Your one-time password is shown here during development:\n${result.otp}`
          : "We've sent you a verification code."
      );
      setStep("otp");
    } catch (err) {
      setError(userFacingAuthMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const updateOtpDigit = (index: number, value: string) => {
    clearOtpAlerts();
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otp.padEnd(6, " ").split("");
    next[index] = digit || " ";
    setOtp(next.join("").trimEnd());
    if (digit) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (otpCode.length < 6) return;
    setBusy(true);
    clearOtpAlerts();
    try {
      const result = await api.verifyOtp(email.trim(), otpCode);
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
      setMessage(
        result.otp
          ? `A new development code:\n${result.otp}`
          : "We've sent another verification code."
      );
      setOtpCountdownSec(8 * 60 + 9);
    } catch (err) {
      setError(userFacingAuthMessage(err));
    } finally {
      setBusy(false);
    }
  };


  const glassSurface =
    "relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/[0.13] bg-gradient-to-br from-white/[0.11] via-white/[0.04] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_32px_100px_-32px_rgba(59,130,246,0.5),0_0_80px_-40px_rgba(139,92,246,0.35)] backdrop-blur-2xl";

  const emailHasIssue = Boolean(emailFieldError || error);
  const emailAriaDescribedBy =
    emailFieldError && error
      ? "email-format-msg email-api-msg"
      : emailFieldError
        ? "email-format-msg"
        : error
          ? "email-api-msg"
          : undefined;

  return (
    <main className="relative isolate h-dvh min-h-0 overflow-hidden bg-[#05070a] text-[#e8eaf6]">
      <LoginAmbientOrbs />

      <div className="relative z-[1] flex h-full min-h-0 flex-col lg:flex-row">
        <BrandPanel />

        <section className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden lg:w-1/2 lg:max-w-none">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(15,23,42,0.5)_0%,rgba(5,7,10,0.92)_50%,rgba(5,7,10,1)_100%)] lg:bg-[linear-gradient(200deg,rgba(30,27,75,0.25)_0%,rgba(5,7,10,0.94)_55%,rgba(5,7,10,1)_100%)]" />

          <div className="relative z-[2] flex shrink-0 items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] shadow-lg shadow-blue-600/25">
                <Rocket className="size-5 text-white" aria-hidden />
              </div>
              <span className="bg-gradient-to-r from-white to-[#c4b5fd] bg-clip-text text-lg font-bold tracking-tight text-transparent">
                EventPilot AI
              </span>
            </div>
            <Button
              className="size-10 rounded-full border-white/10 bg-white/5 text-[#aeb8d9] backdrop-blur-sm hover:bg-white/10"
              variant="outline"
              size="icon"
              type="button"
              aria-label="Help"
            >
              <HelpCircle className="size-[1.125rem]" />
            </Button>
          </div>

          <div className="relative z-[2] flex min-h-0 flex-[1_1_0%] flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth [-webkit-overflow-scrolling:touch] px-4 pb-10 pt-4 sm:px-8 sm:pb-12 lg:py-12">
              <div className="mx-auto flex w-full max-w-[440px] flex-col justify-start gap-0 lg:justify-start">
                {step === "email" ? (
                  <form noValidate className={`${glassSurface} p-5 sm:p-8`} onSubmit={requestOtp}>
                    <div className="pointer-events-none absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent sm:left-10 sm:right-10" />
                    <div className="mb-8 text-center lg:text-left">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#93c5fd]/90">Sign in</p>
                      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Welcome to EventPilot AI</h1>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#9fb0d9]">
                        Managing guests, logistics &amp; check-ins in one intelligent workspace.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-[#8898c8]" htmlFor="email">
                        Step 1 · Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-[#6b7aa8]" aria-hidden />
                        <Input
                          aria-invalid={emailHasIssue}
                          aria-describedby={emailAriaDescribedBy}
                          className={cn(
                            "h-12 border-white/15 bg-black/35 pl-11 pr-4 text-[0.9375rem] text-white placeholder:text-[#62708f]",
                            emailHasIssue
                              ? "border-rose-500/65 ring-2 ring-inset ring-rose-500/25 focus-visible:border-rose-400/75 focus-visible:ring-rose-500/30"
                              : "focus-visible:border-sky-400/60 focus-visible:ring-sky-500/25"
                          )}
                          id="email"
                          type="text"
                          inputMode="email"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailFieldError("");
                            setError("");
                          }}
                          placeholder="you@company.com"
                          autoComplete="email"
                        />
                      </div>
                      {emailFieldError ? (
                        <p id="email-format-msg" role="alert" className="text-[13px] leading-snug text-rose-300">
                          {emailFieldError}
                        </p>
                      ) : null}
                      {error ? (
                        <p id="email-api-msg" role="alert" className="text-[13px] leading-snug text-rose-300">
                          {error}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="submit"
                      disabled={busy}
                      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] text-[15px] font-semibold text-white shadow-[0_0_32px_-4px_rgba(37,99,235,0.85)] transition-all hover:bg-[#1d4ed8] hover:shadow-[0_0_48px_-4px_rgba(59,130,246,0.9)] disabled:opacity-60"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          Send OTP
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>

                    <AuthDivider label="OR" />

                    <Button
                      type="button"
                      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/12 bg-white text-[15px] font-semibold text-slate-900 shadow-sm hover:bg-neutral-50"
                    >
                      <GoogleIcon />
                      Continue with Google
                    </Button>

                    <LoginFormFootnotes />
                  </form>
                ) : (
                  <form noValidate className={`${glassSurface} p-5 sm:p-8`} onSubmit={verifyOtp}>
                    <div className="pointer-events-none absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent sm:left-10 sm:right-10" />
                    <div className="-ml-2 mb-4">
                      <Button
                        variant="link"
                        className="group inline-flex items-center gap-2 px-2 text-sm font-medium text-[#9fb0d9] hover:text-white"
                        type="button"
                        onClick={() => {
                          setStep("email");
                          setOtp("");
                          setMessage("");
                          clearOtpAlerts();
                          setEmailFieldError("");
                        }}
                      >
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                        Change email
                      </Button>
                    </div>

                    <div className="mb-8 text-center lg:text-left">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#93c5fd]/90">Verify</p>
                      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Check your inbox</h1>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#9fb0d9]">
                        Enter the 6-digit code we sent to{" "}
                        <span className="font-medium text-[#c7d5f0]" title={email}>
                          {email}
                        </span>
                      </p>
                    </div>

                    <fieldset
                      className="space-y-2"
                      aria-describedby={
                        [message ? "otp-help-msg" : "", error ? "otp-error-msg" : ""].filter(Boolean).join(" ") ||
                        undefined
                      }
                    >
                      <legend className="text-xs font-semibold uppercase tracking-wide text-[#8898c8]">Step 2 · OTP code</legend>
                      <div className="flex justify-center gap-2 sm:gap-3 lg:justify-start">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Input
                            key={index}
                            id={`otp-${index}`}
                            className="aspect-square max-h-[52px] min-h-[48px] w-full max-w-[48px] rounded-xl border border-white/14 bg-black/45 p-0 text-center text-xl font-semibold tracking-tight text-[#bae6fd] shadow-inner focus-visible:border-sky-400/70 focus-visible:ring-[3px] focus-visible:ring-sky-500/35 sm:h-14 sm:max-h-[56px] sm:max-w-[52px] sm:text-2xl"
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
                              const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                              applyOtpFromDigits(digits);
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex w-full flex-col gap-2 pt-1 text-xs text-[#8b98bc] sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                        <div className="flex items-center justify-center gap-2 tabular-nums sm:justify-start">
                          <Clock3 className="size-4 text-sky-400/70" aria-hidden />
                          <span>Countdown:</span>
                          <span className="font-semibold text-[#c7d9ff]">{formatHms(otpCountdownSec)}</span>
                        </div>
                        <button
                          type="button"
                          className={`text-center font-semibold transition-colors sm:text-right ${otpCountdownSec === 0 ? "cursor-pointer text-sky-300 hover:text-white" : "cursor-not-allowed opacity-55"}`}
                          disabled={otpCountdownSec > 0 || busy}
                          onClick={() => void resendOtp()}
                        >
                          Resend OTP
                        </button>
                      </div>
                      {message ? (
                        <p id="otp-help-msg" className="text-[13px] leading-snug text-sky-200/92 whitespace-pre-line">
                          {message}
                        </p>
                      ) : null}
                      {error ? (
                        <p id="otp-error-msg" role="alert" className="text-[13px] leading-snug text-rose-300">
                          {error}
                        </p>
                      ) : null}
                    </fieldset>

                    <Button
                      type="submit"
                      disabled={busy || otpCode.length < 6}
                      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] text-[15px] font-semibold text-white shadow-[0_0_32px_-4px_rgba(37,99,235,0.85)] transition-all hover:bg-[#1d4ed8] disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="size-5 animate-spin" /> : null}
                      Verify &amp; Continue
                      {!busy ? <ArrowRight className="size-4" /> : null}
                    </Button>

                    <LoginFormFootnotes showTrustLine={false} />
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginFormFootnotes({ showTrustLine = true }: { showTrustLine?: boolean }) {
  return (
    <footer className="mt-8 border-t border-white/10 pt-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-[#97a7ce]"
          aria-label="Legal"
        >
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacy Policy
          </Link>
          <span className="text-[#3d4a66]" aria-hidden>
            ·
          </span>
          <Link href="/terms" className="transition-colors hover:text-white">
            Terms of Service
          </Link>
        </nav>
        {showTrustLine ? (
          <p className="text-xs leading-relaxed text-[#8890a8]">
            Trusted for managing modern events &amp; guest experiences.
          </p>
        ) : null}
        <p className="text-[10px] text-[#5c637a]">© 2024–2026 EventPilot AI. All rights reserved.</p>
      </div>
    </footer>
  );
}

function LoginAmbientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-[15%] -top-[20%] h-[min(560px,80vw)] w-[min(560px,80vw)] rounded-full bg-cyan-500/[0.16] blur-[100px]" />
      <div className="absolute -right-[8%] top-[35%] h-[420px] w-[420px] rounded-full bg-violet-600/[0.22] blur-[90px]" />
      <div className="absolute bottom-[-18%] left-[35%] h-[340px] w-[340px] rounded-full bg-blue-600/[0.15] blur-[80px]" />
      <div className="absolute right-[12%] top-[8%] h-[220px] w-[220px] rounded-full bg-sky-400/10 blur-[72px]" />
    </div>
  );
}

const BRAND_FEATURES_LEFT = [
  { Icon: UserRoundCheck, label: "Smart RSVP tracking" },
  { Icon: ScanLine, label: "Real-time check-ins" },
] as const;

const BRAND_FEATURES_RIGHT = [
  { Icon: LayoutDashboard, label: "Operations dashboard" },
  { Icon: ListChecks, label: "Cab & hotel logistics" },
] as const;

function FloatingFeatureBadge({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <div className="z-10 w-full max-w-[148px] rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-xl">
      <Icon className="mb-1.5 size-4 text-sky-300" aria-hidden />
      <p className="text-[11px] font-semibold leading-snug text-white">{label}</p>
    </div>
  );
}

function BrandPanel() {
  return (
    <section className="relative hidden h-full flex-1 flex-col overflow-hidden border-r border-white/10 lg:flex lg:max-w-[52%]">
      <LoginAmbientOrbs />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(15,23,42,0.4)_0%,rgba(6,11,26,0.75)_42%,rgba(5,7,12,0.95)_100%)]" />
      <div className="relative z-10 flex h-full flex-col px-10 py-12 xl:px-16 xl:py-14">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#9333ea] shadow-lg shadow-indigo-500/35">
            <Rocket className="size-6 text-white" aria-hidden />
          </div>
          <span className="bg-gradient-to-r from-white via-[#dbeafe] to-[#cfc5ff] bg-clip-text text-xl font-bold tracking-tight text-transparent xl:text-[1.35rem]">
            EventPilot AI
          </span>
        </div>

        <h2 className="mt-14 max-w-lg text-[1.85rem] font-bold leading-[1.2] tracking-tight text-white xl:mt-[4.25rem] xl:text-[clamp(2rem,2.6vw,2.85rem)]">
          Managing Guests, Logistics &amp; Check-ins{" "}
          <span className="bg-gradient-to-r from-[#7dd3fc] via-[#93c5fd] to-[#c4b5fd] bg-clip-text text-transparent">
            in One Platform
          </span>
        </h2>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#98aaca] xl:text-[0.9725rem]">
          RSVP, transport, hotels, QR check-in, and live ops—purpose-built so your team executes smoothly from doorstep to ballroom.
        </p>

        <div className="relative mt-auto flex min-h-[min(340px,36vh)] w-full shrink-0 items-end justify-between gap-6 pb-4 pt-8 xl:gap-10 xl:pb-6 xl:pt-12">
          <div className="pointer-events-none absolute bottom-[12%] left-1/2 h-[200px] w-[200px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#06b6d4]/30 via-[#6366f1]/35 to-[#a855f7]/30 blur-[50px]" />
          <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-[3.75rem] xl:gap-[4.5rem]">
            {BRAND_FEATURES_LEFT.map(({ Icon, label }, row) => (
              <div key={label} className={row === 1 ? "pl-[2.5rem] xl:pl-14" : ""}>
                <FloatingFeatureBadge Icon={Icon} label={label} />
              </div>
            ))}
          </div>
          <div className="relative z-10 flex min-w-0 flex-1 flex-col items-end gap-[3.75rem] xl:gap-[4.5rem]">
            {BRAND_FEATURES_RIGHT.map(({ Icon, label }, row) => (
              <div key={label} className={row === 1 ? "pr-[2.5rem] xl:pr-14" : ""}>
                <FloatingFeatureBadge Icon={Icon} label={label} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-7 flex items-center gap-4">
      <div className="min-h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7383a9]">{label}</span>
      <div className="min-h-px flex-1 bg-gradient-to-l from-transparent via-white/15 to-transparent" />
    </div>
  );
}
