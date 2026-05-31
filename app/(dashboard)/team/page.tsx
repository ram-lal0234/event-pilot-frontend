"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import {
  DashboardPage,
  DashboardPageSkeleton,
} from "@/components/layout/dashboard-page";
import { TeamMemberCard } from "@/components/domain/team/team-member-card";
import { api, type AccessLevel, type TeamMemberRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function TeamPage() {
  const { token, events, refreshEvents } = useApp();
  const { isOwner } = useEventAccess();
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageMember, setManageMember] = useState<TeamMemberRecord | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<TeamMemberRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await api.listTeamMembers(token));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load team");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOwner) void load();
    else setLoading(false);
  }, [isOwner, load]);

  const sortedMembers = useMemo(() => {
    const rank = (member: TeamMemberRecord) => {
      if (member.role === "OWNER") return 0;
      if (member.status === "ACCEPTED") return 1;
      if (member.status === "PENDING") return 2;
      return 3;
    };
    return [...members].sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      return (a.name || a.email).localeCompare(b.name || b.email);
    });
  }, [members]);

  const memberStats = useMemo(() => {
    const pending = members.filter((m) => m.status === "PENDING").length;
    const suspended = members.filter((m) => m.status === "REVOKED").length;
    return { pending, suspended };
  }, [members]);

  if (!isOwner) {
    return (
      <DashboardPage
        title="Team"
        description="Only the account owner can manage team members."
        breadcrumb="Account"
      >
        <p className="text-sm text-muted-foreground">
          Contact your workspace owner if you need access changes.
        </p>
      </DashboardPage>
    );
  }

  if (loading) {
    return <DashboardPageSkeleton variant="card-grid" cards={6} />;
  }

  return (
    <DashboardPage
      title="Team"
      description="Invite once, assign members to specific events."
      breadcrumb="Account"
      actions={
        <Button className="gap-2" type="button" onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" />
          Invite member
        </Button>
      }
    >
      {members.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {members.length} member{members.length === 1 ? "" : "s"}
            {memberStats.pending > 0 ? ` · ${memberStats.pending} pending` : ""}
            {memberStats.suspended > 0 ? ` · ${memberStats.suspended} suspended` : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onManage={() => setManageMember(member)}
                onCopyInvite={() => {
                  if (!member.inviteUrl) return;
                  void navigator.clipboard.writeText(member.inviteUrl);
                  toast.success("Invite link copied");
                }}
                onSuspend={() => setSuspendTarget(member)}
                onReactivate={() =>
                  void (async () => {
                    try {
                      await api.reactivateTeamMember(token, member.id);
                      toast.success("Member reactivated");
                      await load();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not reactivate");
                    }
                  })()
                }
              />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-surface-container-low text-primary">
            <Users className="size-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">No team members yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite staff, drivers, or hotel desk users and assign them to specific events.
          </p>
          <Button className="mt-5 gap-2" type="button" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Invite member
          </Button>
        </div>
      )}

      <InviteMemberSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        events={events}
        busy={busy}
        onSubmit={async (payload) => {
          setBusy(true);
          try {
            const result = await api.inviteTeamMember(token, payload);
            toast.success("Invitation sent");
            if (result.inviteUrl) {
              await navigator.clipboard.writeText(result.inviteUrl);
              toast.message("Invite link copied to clipboard");
            }
            setInviteOpen(false);
            await load();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not invite");
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(suspendTarget)}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title={suspendTarget ? `Suspend ${suspendTarget.name || suspendTarget.email}?` : "Suspend member?"}
        description="They will lose access to this workspace until you reactivate them."
        confirmLabel="Suspend member"
        variant="destructive"
        loading={busy}
        onConfirm={async () => {
          if (!suspendTarget) return;
          setBusy(true);
          try {
            await api.suspendTeamMember(token, suspendTarget.id);
            toast.success("Member suspended");
            setSuspendTarget(null);
            await load();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not suspend");
          } finally {
            setBusy(false);
          }
        }}
      />

      <ManageMemberSheet
        member={manageMember}
        events={events}
        onClose={() => setManageMember(null)}
        onSave={async (memberId, role, eventAssignments) => {
          setBusy(true);
          try {
            await api.updateTeamMemberRole(token, memberId, role);
            await api.updateTeamMemberEvents(token, memberId, eventAssignments);
            toast.success("Member updated");
            setManageMember(null);
            await load();
            await refreshEvents();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save");
          } finally {
            setBusy(false);
          }
        }}
        busy={busy}
      />
    </DashboardPage>
  );
}

function InviteMemberSheet({
  open,
  onOpenChange,
  events,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Array<{ id: string; name: string }>;
  busy: boolean;
  onSubmit: (payload: {
    email: string;
    role: "ADMIN" | "STAFF" | "DRIVER" | "HOTEL";
    name?: string;
    eventAssignments?: Array<{ eventId: string; accessLevel: AccessLevel }>;
  }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF" | "DRIVER" | "HOTEL">("STAFF");
  const [selectedEvents, setSelectedEvents] = useState<Record<string, AccessLevel>>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit({
      email,
      name: name || undefined,
      role,
      eventAssignments: Object.entries(selectedEvents).map(([eventId, accessLevel]) => ({
        eventId,
        accessLevel,
      })),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Invite team member</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            maxLength={254}
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            maxLength={120}
          />
          <Select
            value={role}
            onValueChange={(next) => {
              if (next != null) setRole(next as "ADMIN" | "STAFF" | "DRIVER" | "HOTEL");
            }}
          >
            <SelectTrigger className="w-full justify-between font-normal">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="DRIVER">Driver</SelectItem>
              <SelectItem value="HOTEL">Hotel</SelectItem>
            </SelectContent>
          </Select>
          <EventAccessList
            title="Initial event access (optional)"
            assignments={selectedEvents}
            events={events}
            onChange={setSelectedEvents}
          />
          </SheetBody>
          <SheetFooter>
            <Button type="submit" loading={busy} loadingText="Sending">
              Send invite
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EventAccessList({
  title,
  assignments,
  events,
  onChange,
}: {
  title: string;
  assignments: Record<string, AccessLevel>;
  events: Array<{ id: string; name: string }>;
  onChange: (next: Record<string, AccessLevel>) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="space-y-2">
        {events.map((event) => {
          const accessLevel = assignments[event.id];
          const checked = Boolean(accessLevel);

          return (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5"
            >
              <Checkbox
                checked={checked}
                aria-label={`Access to ${event.name}`}
                onChange={(e) => {
                  const next = { ...assignments };
                  if (e.target.checked) {
                    next[event.id] = accessLevel ?? "FULL";
                  } else {
                    delete next[event.id];
                  }
                  onChange(next);
                }}
              />
              <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{event.name}</span>
              {checked ? (
                <Select
                  value={accessLevel}
                  onValueChange={(level) => {
                    if (level != null) {
                      onChange({ ...assignments, [event.id]: level as AccessLevel });
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="h-8 w-[7.25rem] shrink-0 justify-between font-normal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="FULL">Full</SelectItem>
                    <SelectItem value="READ_ONLY">Read only</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ManageMemberSheet({
  member,
  events,
  onClose,
  onSave,
  busy,
}: {
  member: TeamMemberRecord | null;
  events: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (
    memberId: string,
    role: "ADMIN" | "STAFF" | "DRIVER" | "HOTEL",
    eventAssignments: Array<{ eventId: string; accessLevel: AccessLevel }>,
  ) => Promise<void>;
  busy: boolean;
}) {
  const [role, setRole] = useState<"ADMIN" | "STAFF" | "DRIVER" | "HOTEL">("STAFF");
  const [assignments, setAssignments] = useState<Record<string, AccessLevel>>({});

  useEffect(() => {
    if (!member) return;
    setRole(
      member.role === "ADMIN" ||
        member.role === "DRIVER" ||
        member.role === "HOTEL"
        ? member.role
        : "STAFF",
    );
    const map: Record<string, AccessLevel> = {};
    member.eventAccess.forEach((grant) => {
      map[grant.eventId] = grant.accessLevel;
    });
    setAssignments(map);
  }, [member]);

  if (!member) return null;

  return (
    <Sheet open={Boolean(member)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Manage {member.name || member.email}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <Select
            value={role}
            onValueChange={(next) => {
              if (next != null) setRole(next as "ADMIN" | "STAFF" | "DRIVER" | "HOTEL");
            }}
          >
            <SelectTrigger className="w-full justify-between font-normal">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="DRIVER">Driver</SelectItem>
              <SelectItem value="HOTEL">Hotel</SelectItem>
            </SelectContent>
          </Select>
          <EventAccessList
            title="Event access"
            assignments={assignments}
            events={events}
            onChange={setAssignments}
          />
        </SheetBody>
        <SheetFooter>
          <Button
            type="button"
            loading={busy}
            loadingText="Saving"
            onClick={() =>
              void onSave(
                member.id,
                role,
                Object.entries(assignments).map(([eventId, accessLevel]) => ({
                  eventId,
                  accessLevel,
                })),
              )
            }
          >
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
