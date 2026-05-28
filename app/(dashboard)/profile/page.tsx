"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Building2, User } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { api, type AccountMembership, type AccountRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const roleLabels: Record<AccountRole, string> = {
  OWNER: "Account owner",
  ADMIN: "Admin",
  STAFF: "Staff",
};

export default function ProfilePage() {
  const { token, user, account, refreshAccount } = useApp();
  const { isOwner } = useEventAccess();
  const [membership, setMembership] = useState<AccountMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAccountMe(token);
      setMembership(result.membership);
      setDisplayName(result.membership.name ?? "");
      setPhone(result.membership.phone ?? "");
      setWorkspaceName(result.account.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileBusy(true);
    try {
      const updated = await api.updateMyProfile(token, {
        name: displayName,
        phone,
      });
      setMembership(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setProfileBusy(false);
    }
  };

  const onSaveWorkspace = async (event: FormEvent) => {
    event.preventDefault();
    if (!isOwner) return;
    const trimmed = workspaceName.trim();
    if (trimmed.length < 2) {
      toast.error("Workspace name must be at least 2 characters");
      return;
    }
    setAccountBusy(true);
    try {
      await api.updateAccountName(token, trimmed);
      await refreshAccount();
      toast.success("Workspace name updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save workspace");
    } finally {
      setAccountBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full max-w-lg" />
        <Skeleton className="h-40 w-full max-w-lg" />
      </div>
    );
  }

  const role = membership?.role ?? user.accountRole;

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <User className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Your sign-in details and workspace settings.</p>
        </div>
      </div>

      <section className="max-w-lg space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
        <h2 className="text-sm font-semibold text-foreground">Your details</h2>
        <form className="space-y-4" onSubmit={(e) => void onSaveProfile(e)}>
          <Field label="Email">
            <Input value={user.email} disabled className="bg-muted/40" />
          </Field>
          <Field label="Display name" hint="Shown to your team; optional.">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Ram Lal"
              maxLength={120}
            />
          </Field>
          <Field label="Phone" hint="Optional contact number.">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 …"
              maxLength={30}
            />
          </Field>
          {role ? (
            <p className="text-xs text-muted-foreground">
              Role: <span className="font-medium text-foreground">{roleLabels[role]}</span>
            </p>
          ) : null}
          <Button type="submit" disabled={profileBusy}>
            {profileBusy ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </section>

      <section className="max-w-lg space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Workspace</h2>
        </div>
        {isOwner ? (
          <form className="space-y-4" onSubmit={(e) => void onSaveWorkspace(e)}>
            <Field label="Workspace name" hint="Your planning business name (visible in the app header).">
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Ram Lal Events"
                maxLength={120}
                required
                minLength={2}
              />
            </Field>
            <Button type="submit" disabled={accountBusy}>
              {accountBusy ? "Saving…" : "Save workspace"}
            </Button>
          </form>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{account?.name ?? "—"}</p>
            <p className="text-muted-foreground">
              Only the account owner can change the workspace name.{" "}
              <Link href="/team" className="text-primary underline-offset-2 hover:underline">
                Team
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
