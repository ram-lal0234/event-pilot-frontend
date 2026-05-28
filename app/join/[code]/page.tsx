"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { persistAuthSession, readAuthSession } from "@/lib/auth-session";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params?.code;
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof api.getJoinPreview>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!code) return;
    api
      .getJoinPreview(code)
      .then(setPreview)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Invalid invite"))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    const { token } = readAuthSession();
    setHasToken(Boolean(token));
  }, []);

  useEffect(() => {
    if (!code || loading || !preview || hasToken) return;
    const params = new URLSearchParams({
      join: code,
      email: preview.email,
      next: "/",
    });
    router.replace(`/login?${params.toString()}`);
  }, [code, hasToken, loading, preview, router]);

  const accept = async () => {
    const { token } = readAuthSession();
    if (!code || !token) return;
    setAccepting(true);
    try {
      const result = await api.acceptJoin(token, code);
      persistAuthSession(result);
      toast.success(`Welcome to ${preview?.accountName || "the team"}`);
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f8fc] text-sm text-muted-foreground">
        Loading invitation…
      </main>
    );
  }

  if (!preview) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center p-6">
        <p className="text-sm text-destructive">This invitation is invalid or expired.</p>
      </main>
    );
  }

  if (!hasToken) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f8fc] text-sm text-muted-foreground">
        Redirecting to sign in…
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f8fc] px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h1 className="text-xl font-semibold">Join {preview.accountName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are signed in. Accept this invitation as <strong>{preview.role}</strong> (
          {preview.email}).
        </p>
        <Button className="mt-6 w-full" loading={accepting} loadingText="Joining" onClick={() => void accept()}>
          Accept invitation
        </Button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Wrong account?{" "}
          <Link
            href={`/login?join=${code}&email=${encodeURIComponent(preview.email)}`}
            className="font-medium text-primary hover:underline"
          >
            Sign in with invited email
          </Link>
        </p>
      </div>
    </main>
  );
}
