"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginScreen } from "@/components/auth/login-screen";
import type { AuthUser } from "@/lib/api";
import { persistAuthSession, readAuthSession } from "@/lib/auth-session";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/";
  const email = searchParams.get("email") || "";
  const join = searchParams.get("join") || "";

  useEffect(() => {
    const { token } = readAuthSession();
    if (!token) return;
    if (join) {
      router.replace(`/join/${join}`);
      return;
    }
    router.replace(next.startsWith("/") ? next : "/");
  }, [join, next, router]);

  const handleAuthenticated = (result: { accessToken: string; user: AuthUser }) => {
    persistAuthSession(result);
    router.replace(next.startsWith("/") ? next : "/");
  };

  return (
    <LoginScreen
      initialEmail={email}
      joinInviteCode={join || undefined}
      lockEmail={Boolean(join && email)}
      onAuthenticated={handleAuthenticated}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-dvh items-center justify-center overflow-hidden text-sm text-muted-foreground">
          Loading…
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
