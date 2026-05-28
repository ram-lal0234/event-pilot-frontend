"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import {
  DashboardPage,
  DashboardPageSkeleton,
} from "@/components/layout/dashboard-page";
import { api, type AccessLevel, type TeamMemberRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
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
    return <DashboardPageSkeleton />;
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
      <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{member.name || member.email}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {member.role}
                    {" · "}
                    {member.status === "PENDING" ? "Pending invite" : "Active"}
                    {member.eventAccess.length
                      ? ` · ${member.eventAccess.length} event(s)`
                      : member.role !== "OWNER"
                        ? " · No events assigned"
                        : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {member.status === "PENDING" && member.inviteUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        void navigator.clipboard.writeText(member.inviteUrl!);
                        toast.success("Invite link copied");
                      }}
                    >
                      <Copy className="size-4" />
                      Copy invite
                    </Button>
                  ) : null}
                  {member.role !== "OWNER" ? (
                    <>
                      <Button type="button" size="sm" variant="outline" onClick={() => setManageMember(member)}>
                        Manage
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void (async () => {
                            try {
                              await api.revokeTeamMember(token, member.id);
                              toast.success("Member revoked");
                              await load();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Could not revoke");
                            }
                          })()
                        }
                      >
                        Remove
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
      </div>

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
    role: "ADMIN" | "STAFF";
    name?: string;
    eventAssignments?: Array<{ eventId: string; accessLevel: AccessLevel }>;
  }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
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
        <SheetHeader>
          <SheetTitle>Invite team member</SheetTitle>
        </SheetHeader>
        <form className="space-y-4 px-4 pb-6" onSubmit={handleSubmit}>
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
          <Select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <div className="space-y-2">
            <p className="text-sm font-medium">Initial event access (optional)</p>
            {events.map((event) => (
              <label key={event.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(selectedEvents[event.id])}
                  onChange={(e) => {
                    setSelectedEvents((prev) => {
                      const next = { ...prev };
                      if (e.target.checked) next[event.id] = "FULL";
                      else delete next[event.id];
                      return next;
                    });
                  }}
                />
                <span className="flex-1">{event.name}</span>
                {selectedEvents[event.id] ? (
                  <Select
                    className="h-8 w-28"
                    value={selectedEvents[event.id]}
                    onChange={(ev) =>
                      setSelectedEvents((prev) => ({
                        ...prev,
                        [event.id]: ev.target.value as AccessLevel,
                      }))
                    }
                  >
                    <option value="FULL">Full</option>
                    <option value="READ_ONLY">Read only</option>
                  </Select>
                ) : null}
              </label>
            ))}
          </div>
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
    role: "ADMIN" | "STAFF",
    eventAssignments: Array<{ eventId: string; accessLevel: AccessLevel }>,
  ) => Promise<void>;
  busy: boolean;
}) {
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [assignments, setAssignments] = useState<Record<string, AccessLevel>>({});

  useEffect(() => {
    if (!member) return;
    setRole(member.role === "ADMIN" ? "ADMIN" : "STAFF");
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
        <div className="space-y-4 px-4 pb-6">
          <Select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <div className="space-y-2">
            <p className="text-sm font-medium">Event access</p>
            {events.map((event) => (
              <label key={event.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(assignments[event.id])}
                  onChange={(e) => {
                    setAssignments((prev) => {
                      const next = { ...prev };
                      if (e.target.checked) next[event.id] = "FULL";
                      else delete next[event.id];
                      return next;
                    });
                  }}
                />
                <span className="flex-1">{event.name}</span>
                {assignments[event.id] ? (
                  <Select
                    className="h-8 w-28"
                    value={assignments[event.id]}
                    onChange={(ev) =>
                      setAssignments((prev) => ({
                        ...prev,
                        [event.id]: ev.target.value as AccessLevel,
                      }))
                    }
                  >
                    <option value="FULL">Full</option>
                    <option value="READ_ONLY">Read only</option>
                  </Select>
                ) : null}
              </label>
            ))}
          </div>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
