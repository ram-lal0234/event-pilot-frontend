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
  MailCheck,
  Rocket,
  ScanLine,
  UserRoundCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type AuthUser } from "@/lib/api";

type LoginScreenProps = {
  onAuthenticated: (result: { accessToken: string; user: AuthUser }) => void;
};

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
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
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api.verifyOtp(email, otpCode);
      onAuthenticated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify OTP");
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setBusy(true);
    try {
      const result = await api.requestOtp(email);
      setMessage(result.otp ? `Development OTP: ${result.otp}` : "OTP sent to email");
      setOtpCountdownSec(8 * 60 + 9);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend OTP");
    } finally {
      setBusy(false);
    }
  };

  const glassSurface =
    "relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/[0.13] bg-gradient-to-br from-white/[0.11] via-white/[0.04] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_32px_100px_-32px_rgba(59,130,246,0.5),0_0_80px_-40px_rgba(139,92,246,0.35)] backdrop-blur-2xl";

  return (
    <main className="relative isolate h-dvh min-h-0 overflow-hidden bg-[#05070a] text-[#e8eaf6]">
      <LoginAmbientOrbs />

      <div className="relative z-[1] flex h-full min-h-0 flex-col lg:flex-row">
        <BrandPanel compact={step === "otp"} />

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
                  <form className={`${glassSurface} p-5 sm:p-8`} onSubmit={requestOtp}>
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
                          className="h-12 border-white/15 bg-black/35 pl-11 pr-4 text-[0.9375rem] text-white placeholder:text-[#62708f] focus-visible:border-sky-400/60 focus-visible:ring-sky-500/25"
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {message && (
                      <p className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-100">{message}</p>
                    )}
                    {error && (
                      <p className="mt-4 rounded-xl border border-rose-500/25 bg-rose-950/40 px-3 py-2.5 text-sm text-rose-100">{error}</p>
                    )}

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
                  <form className={`${glassSurface} p-5 sm:p-8`} onSubmit={verifyOtp}>
                    <div className="pointer-events-none absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent sm:left-10 sm:right-10" />
                    <Button
                      variant="link"
                      className="group mb-6 -ml-2 inline-flex items-center gap-2 px-2 text-sm font-medium text-[#9fb0d9] hover:text-white"
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setError("");
                      }}
                    >
                      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                      Change email
                    </Button>

                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8898c8]">Step 2 · OTP Verification</div>
                    <div className="mx-auto mb-8 max-w-sm text-center">
                      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-sky-400/25 bg-gradient-to-br from-[#2563eb]/35 to-purple-600/25 shadow-[0_0_48px_-12px_rgba(59,130,246,0.55)]">
                        <MailCheck className="size-8 text-sky-200" />
                      </div>
                      <h2 className="text-xl font-semibold text-white sm:text-2xl">Verify your email</h2>
                      <p className="mt-2 break-all text-sm text-[#9fb0d9]">Enter the code sent to {email}</p>
                    </div>

                    <div className="flex justify-center gap-2 sm:gap-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          className="aspect-square max-h-[52px] min-h-[48px] w-full max-w-[48px] rounded-xl border-white/14 bg-black/45 p-0 text-center text-xl font-semibold tracking-tight text-[#bae6fd] shadow-inner focus-visible:border-sky-400/70 focus-visible:ring-[3px] focus-visible:ring-sky-500/35 sm:h-14 sm:max-h-[56px] sm:max-w-[52px] sm:text-2xl"
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
                            setOtp(digits);
                            document.getElementById(`otp-${Math.min(digits.length, 5)}`)?.focus();
                          }}
                        />
                      ))}
                    </div>

                    <div className="mt-4 flex flex-col items-center justify-between gap-2 text-xs text-[#8b98bc] sm:flex-row sm:text-sm">
                      <div className="flex items-center gap-2 tabular-nums">
                        <Clock3 className="size-4 text-sky-400/70" aria-hidden />
                        <span>Countdown:</span>
                        <span className="font-semibold text-[#c7d9ff]">{formatHms(otpCountdownSec)}</span>
                      </div>
                      <button
                        type="button"
                        className={`font-semibold transition-colors ${otpCountdownSec === 0 ? "cursor-pointer text-sky-300 hover:text-white" : "cursor-not-allowed opacity-55"}`}
                        disabled={otpCountdownSec > 0 || busy}
                        onClick={() => void resendOtp()}
                      >
                        Resend OTP
                      </button>
                    </div>

                    {message && (
                      <p className="mt-5 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2.5 text-center text-sm text-sky-100">{message}</p>
                    )}
                    {error && (
                      <p className="mt-5 rounded-xl border border-rose-500/25 bg-rose-950/45 px-3 py-2.5 text-center text-sm text-rose-100">{error}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={busy || otpCode.length < 6}
                      className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] text-[15px] font-semibold text-white shadow-[0_0_32px_-4px_rgba(37,99,235,0.85)] transition-all hover:bg-[#1d4ed8] disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="size-5 animate-spin" /> : null}
                      Verify &amp; Continue
                      {!busy ? <ArrowRight className="size-4" /> : null}
                    </Button>

                    <LoginFormFootnotes />
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

function LoginFormFootnotes() {
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
        <p className="text-xs leading-relaxed text-[#8890a8]">
          Trusted for managing modern events &amp; guest experiences.
        </p>
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

const FLOAT_FEATURES = [
  { Icon: UserRoundCheck, label: "Smart RSVP tracking", className: "left-[6%] top-[54%]" },
  { Icon: LayoutDashboard, label: "Operations dashboard", className: "right-[14%] top-[52%]" },
  { Icon: ScanLine, label: "Real-time check-ins", className: "left-[26%] top-[74%]" },
  { Icon: ListChecks, label: "Cab & hotel logistics", className: "right-[8%] top-[74%]" },
] as const;

function FloatingFeatureBadge({
  Icon,
  label,
  className,
}: {
  Icon: LucideIcon;
  label: string;
  className: string;
}) {
  return (
    <div
      className={`absolute z-10 max-w-[148px] rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-xl ${className}`}
    >
      <Icon className="mb-1.5 size-4 text-sky-300" aria-hidden />
      <p className="text-[11px] font-semibold leading-snug text-white">{label}</p>
    </div>
  );
}

function BrandPanel({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <section className="relative hidden h-full w-[min(100%,340px)] shrink-0 flex-col justify-between overflow-hidden border-r border-white/10 bg-[#060a14]/85 p-8 backdrop-blur-2xl lg:flex">
        <LoginAmbientOrbs />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/55" />
        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] shadow-md shadow-blue-600/25">
              <Rocket className="size-[1.125rem] text-white" />
            </div>
            <span className="bg-gradient-to-r from-white to-[#dbc7ff] bg-clip-text text-base font-bold text-transparent">
              EventPilot AI
            </span>
          </div>
          <p className="max-w-[13rem] text-sm font-medium leading-snug text-[#b8c9ef]">
            Guest lists, check-ins &amp; logistics—streamlined on event day.
          </p>
        </div>
        <div className="relative z-10 grid gap-2">
          {FLOAT_FEATURES.slice(0, 3).map(({ Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-md"
            >
              <Icon className="size-4 shrink-0 text-sky-300" />
              <span className="text-[11px] font-semibold text-white">{label}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

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

        <div className="relative mt-auto min-h-[min(360px,38vh)] w-full shrink-0">
          <div className="pointer-events-none absolute bottom-[18%] left-1/2 h-[200px] w-[200px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#06b6d4]/30 via-[#6366f1]/35 to-[#a855f7]/30 blur-[50px]" />
          {FLOAT_FEATURES.map(({ Icon, label, className }) => (
            <FloatingFeatureBadge key={label} Icon={Icon} label={label} className={className} />
          ))}
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
