"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Building2, Mail, Phone, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { api, type AccountMembership, type AccountRole } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { pageLayout } from "@/lib/design-tokens";
import { profileInitials, userDisplayName } from "@/lib/user-display";
import { cn } from "@/lib/utils";

const roleLabels: Record<AccountRole, string> = {
  OWNER: "Account owner",
  ADMIN: "Admin",
  STAFF: "Staff",
  DRIVER: "Driver",
  HOTEL: "Hotel",
};

function displayLabel(name: string, email: string) {
  return userDisplayName(name, email);
}

function ProfileSectionCard({
  icon: Icon,
  title,
  description,
  children,
  footer,
  className,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full flex-col gap-0 py-0 ring-border/60", className)}>
      <div className="space-y-1 px-5 pb-4 pt-5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
        <CardDescription className="pl-10 text-xs leading-relaxed">{description}</CardDescription>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="flex-1 space-y-5">{children}</div>
        <div className="mt-6 flex justify-end">{footer}</div>
      </div>
    </Card>
  );
}

function FieldGroup({
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
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

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

  const role = membership?.role ?? user.accountRole;
  const initials = useMemo(
    () => profileInitials(displayName, user.email),
    [displayName, user.email],
  );
  const headingName = useMemo(
    () => displayLabel(displayName, user.email),
    [displayName, user.email],
  );

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <DashboardPage
      title="Profile"
      hideHeader
      spacing="default"
      className="max-w-4xl"
    >
      <Card className="gap-0 overflow-hidden py-0 ring-border/60">
        <div className="bg-gradient-to-r from-primary/12 via-warningBg/80 to-transparent px-5 pb-14 pt-5 sm:px-6 sm:pb-16 sm:pt-6" />
        <CardContent className="relative px-5 pb-6 pt-0 sm:px-6">
          <div className="-mt-11 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:gap-5">
            <Avatar className="size-[4.5rem] border-[3px] border-card shadow-sm after:border-0 sm:size-24">
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1.5 sm:pb-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{headingName}</h2>
                {role ? (
                  <Badge variant="outline" className="gap-1 border-primary/25 bg-primary/5 text-primary">
                    <Shield className="size-3" />
                    {roleLabels[role]}
                  </Badge>
                ) : null}
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-3.5 shrink-0 opacity-70" />
                <span className="truncate">{user.email}</span>
              </p>
              {account?.name ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="size-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{account.name}</span>
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <form onSubmit={(e) => void onSaveProfile(e)} className="contents">
          <ProfileSectionCard
            icon={UserRound}
            title="Personal details"
            description="Shown to your team on invites and event assignments."
            footer={
              <Button type="submit" disabled={profileBusy} className="min-w-[7.5rem]">
                {profileBusy ? "Saving…" : "Save profile"}
              </Button>
            }
          >
            <FieldGroup label="Email" hint="Sign-in email cannot be changed here.">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={user.email} disabled className="h-10 bg-muted/30 pl-9" />
              </div>
            </FieldGroup>

            <FieldGroup label="Display name">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ram Lal"
                minLength={1}
                maxLength={120}
                required
                className="h-10"
              />
            </FieldGroup>

            <FieldGroup label="WhatsApp / phone">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 …"
                  minLength={8}
                  maxLength={30}
                  className="h-10 pl-9"
                />
              </div>
            </FieldGroup>
          </ProfileSectionCard>
        </form>

        {isOwner ? (
          <form onSubmit={(e) => void onSaveWorkspace(e)} className="contents">
            <ProfileSectionCard
              icon={Building2}
              title="Workspace"
              description="Your planning business name — visible in the app header."
              footer={
                <Button type="submit" disabled={accountBusy} className="min-w-[7.5rem]">
                  {accountBusy ? "Saving…" : "Save workspace"}
                </Button>
              }
            >
              <FieldGroup
                label="Workspace name"
                hint="Used in the top bar and when inviting team members."
              >
                <Input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Ram Lal Events"
                  maxLength={120}
                  required
                  minLength={2}
                  className="h-10"
                />
              </FieldGroup>
            </ProfileSectionCard>
          </form>
        ) : (
          <ProfileSectionCard
            icon={Building2}
            title="Workspace"
            description="The workspace you belong to."
            footer={
              <Button variant="outline" render={<Link href="/team" />} nativeButton={false}>
                Open team
              </Button>
            }
          >
            <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3.5">
              <Avatar className="size-11">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {(account?.name ?? "W").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{account?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Current workspace</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Only the account owner can rename the workspace. Contact them or visit Team settings
              if you need a change.
            </p>
          </ProfileSectionCard>
        )}
      </div>
    </DashboardPage>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className={cn(pageLayout.spacing.default, "max-w-4xl space-y-5")}>
      <Card className="gap-0 overflow-hidden py-0">
        <Skeleton className="h-[7.5rem] w-full rounded-none" />
        <CardContent className="px-5 pb-6 pt-0 sm:px-6">
          <div className="-mt-11 flex gap-4 sm:flex-row sm:items-end">
            <Skeleton className="size-[4.5rem] rounded-full sm:size-24" />
            <div className="flex-1 space-y-2 pb-1">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-[22rem] rounded-xl" />
        <Skeleton className="h-[22rem] rounded-xl" />
      </div>
    </div>
  );
}
