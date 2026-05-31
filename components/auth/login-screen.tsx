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
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { GoogleIcon } from "@/components/icons/google-icon";
import { LoginHeroMockup } from "@/components/auth/login-hero-mockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError, type AuthUser } from "@/lib/api";
import { brand, colors, loginTheme } from "@/lib/design-tokens";
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
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

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
    <main className="relative flex h-full max-h-dvh items-center justify-center overflow-hidden p-3 sm:p-4">
      <LoginPageBackdrop />

      <div
        className="relative z-10 flex h-full max-h-full w-full max-w-[980px] flex-col rounded-[24px] p-px shadow-[0_28px_72px_-24px_rgba(179,89,0,0.28)]"
        style={{ background: loginTheme.goldGradient }}
      >
        <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[23px] bg-white">
        <LoginBrandPanel step={step} />

        <section
          className="flex min-h-0 w-full flex-col md:w-[52%] lg:w-1/2"
          style={{ backgroundColor: colors.surface }}
        >
          <header className="flex shrink-0 items-center justify-between px-6 pt-4 sm:px-10 sm:pt-5">
            <Link href="/login" className="flex items-center gap-2.5">
              <BrandLogo priority imageClassName="size-9" />
              <span className="text-base font-bold tracking-tight text-foreground">{brand.name}</span>
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Help
            </Link>
          </header>

          <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-6 py-3 sm:px-10 sm:py-4">
            {joinInviteCode ? (
              <p className="mb-3 shrink-0 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center text-sm text-muted-foreground">
                Team invitation — sign in with the invited email to continue.
              </p>
            ) : null}

            {step === "email" ? (
              <form
                noValidate
                className="mx-auto w-full max-w-[360px] space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void requestOtp(event);
                }}
              >
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Sign in</h1>
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
                      "h-12 rounded-xl border-border text-base",
                      emailHasIssue && "border-destructive",
                    )}
                    style={{ backgroundColor: colors.ivory }}
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
                  className="h-12 w-full gap-2 rounded-full border-0 text-base font-semibold text-[#2c2419] shadow-md"
                  style={{
                    background: loginTheme.goldGradient,
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
              <form
                noValidate
                className="mx-auto w-full max-w-[360px] space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void verifyOtp(event);
                }}
              >
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
                        className="h-12 w-full max-w-[48px] rounded-xl border-border p-0 text-center text-lg font-semibold"
                        style={{ backgroundColor: colors.ivory }}
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
                  className="h-12 w-full gap-2 rounded-full border-0 text-base font-semibold text-[#2c2419] shadow-md"
                  style={{
                    background: loginTheme.goldGradient,
                  }}
                >
                  {busy ? <Loader2 className="size-5 animate-spin" /> : null}
                  Continue
                  {!busy ? <ArrowRight className="size-5" /> : null}
                </Button>
              </form>
            )}
          </div>

          <footer className="mt-auto flex shrink-0 flex-col gap-2 border-t border-border/80 px-6 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
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
      </div>
    </main>
  );
}

function LoginPageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0" style={{ background: loginTheme.pageGradient }} />
      <div className="absolute inset-0" style={{ background: loginTheme.pageGlow }} />
    </div>
  );
}

function HeroRings() {
  const sizes = [300, 236, 172, 108];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2"
    >
      {sizes.map((size) => (
        <span
          key={size}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: size,
            height: size,
            border: "1px solid rgba(243, 229, 171, 0.2)",
          }}
        />
      ))}
    </div>
  );
}

function LoginBrandPanel({ step }: { step: "email" | "otp" }) {
  return (
    <aside
      className="relative hidden min-h-0 flex-col overflow-hidden rounded-l-[22px] text-white md:flex md:w-[48%] lg:w-1/2"
      style={{ background: loginTheme.heroGradient }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{ background: loginTheme.pageGlow }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full blur-3xl"
        style={{ background: loginTheme.goldGradient, opacity: 0.2 }}
      />
      <HeroRings />

      <div className="relative z-10 flex flex-col items-center px-8 pt-10 text-center lg:px-10 lg:pt-12">
        <p className="max-w-[15rem] text-xs leading-relaxed text-white/70 lg:max-w-[18rem] lg:text-[13px]">
          Event operations made simple — guests, RSVP, transport, and check-in in one place.
        </p>
        <h2 className="mt-8 max-w-[12rem] text-[1.75rem] font-bold leading-[1.15] tracking-tight lg:mt-10 lg:max-w-sm lg:text-4xl">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(180deg, #ffffff 0%, #f3e5ab 100%)",
            }}
          >
          {step === "email" ? (
            <>
              Manage
              <br />
              your events
            </>
          ) : (
            <>
              Almost
              <br />
              there
            </>
          )}
          </span>
        </h2>
        {step === "otp" ? (
          <p className="mt-4 max-w-[14rem] text-xs text-white/65">
            Enter the code we sent to your email.
          </p>
        ) : null}
      </div>

      <LoginHeroMockup className="relative z-10" />
    </aside>
  );
}
