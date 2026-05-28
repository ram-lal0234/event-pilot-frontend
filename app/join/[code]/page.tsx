"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginScreen } from "@/components/auth/login-screen";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params?.code;
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof api.getJoinPreview>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
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
    const stored = window.localStorage.getItem("eventpilot.token");
    setToken(stored);
  }, []);

  const finishJoin = (accessToken: string, user: { accountName?: string }) => {
    window.localStorage.setItem("eventpilot.token", accessToken);
    window.localStorage.setItem("eventpilot.user", JSON.stringify(user));
    toast.success(`Welcome to ${preview?.accountName || "the team"}`);
    router.replace("/");
  };

  const accept = async (accessToken: string) => {
    if (!code) return;
    setAccepting(true);
    try {
      const result = await api.acceptJoin(accessToken, code);
      finishJoin(result.accessToken, result.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-md p-6 text-sm text-muted-foreground">Loading invitation…</main>;
  }

  if (!preview) {
    return <main className="mx-auto max-w-md p-6 text-sm text-destructive">This invitation is invalid or expired.</main>;
  }

  if (!token) {
    return (
      <div>
        <main className="border-b border-border bg-card px-4 py-6 text-center">
          <p className="text-lg font-semibold">Join {preview.accountName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in as <strong>{preview.email}</strong> to accept this {preview.role} invitation.
          </p>
        </main>
        <LoginScreen
          initialEmail={preview.email}
          joinInviteCode={code}
          lockEmail
          onAuthenticated={({ accessToken, user }) => {
            finishJoin(accessToken, user);
          }}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-xl font-semibold">Join {preview.accountName}</h1>
      <p className="text-sm text-muted-foreground">
        You are invited as <strong>{preview.role}</strong> ({preview.email}).
      </p>
      <Button
        className="w-full"
        loading={accepting}
        loadingText="Joining"
        onClick={() => void accept(token)}
      >
        Accept invitation
      </Button>
    </main>
  );
}
