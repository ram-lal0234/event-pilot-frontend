import { Check, MoreVertical } from "lucide-react";
import type { CheckedInGuest } from "@/types";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function GuestConfirmation({ guest }: { guest: CheckedInGuest }) {
  return (
    <Card className="border-border shadow-none">
      <div className="rounded-t-lg bg-status-success-bg p-6 text-center">
        <SuccessIcon />
        <p className="text-lg font-semibold text-status-success">
          Welcome, {guest.firstName} {guest.lastName}
        </p>
        <p className="text-sm text-muted-foreground">
          Check-in confirmed at {guest.checkInTime}
        </p>
      </div>
      <CardContent className="space-y-6 p-6">
        <GuestProfile guest={guest} />
        <InfoGrid guest={guest} />
        <SessionsList guest={guest} />
        <ActionButtons />
      </CardContent>
    </Card>
  );
}

function SuccessIcon() {
  return (
    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-status-success">
      <Check className="size-6 text-white" />
    </div>
  );
}

function GuestProfile({ guest }: { guest: CheckedInGuest }) {
  return (
    <div className="flex items-start gap-4">
      <Avatar className="size-14">
        <AvatarImage src={guest.avatar} alt={guest.firstName} />
        <AvatarFallback>
          {guest.firstName[0]}
          {guest.lastName[0]}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="flex flex-wrap gap-2">
          {guest.badges.map((badge, i) => (
            <StatusBadge key={badge} variant={i === 0 ? "vip" : "speaker"}>
              {badge}
            </StatusBadge>
          ))}
        </div>
        <p className="mt-2 text-lg font-bold text-text-main">
          {guest.firstName} {guest.lastName}
        </p>
        <p className="text-sm text-muted-foreground">
          {guest.title}, {guest.company}
        </p>
      </div>
    </div>
  );
}

function InfoGrid({ guest }: { guest: CheckedInGuest }) {
  const items = [
    { label: "Table Number", value: guest.tableNumber },
    { label: "Guest Type", value: guest.guestType },
    { label: "Plus Ones", value: guest.plusOnes },
    { label: "Dietary", value: guest.dietary },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <InfoCard key={item.label} item={item} />
      ))}
    </div>
  );
}

function InfoCard({ item }: { item: { label: string; value: string } }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
        {item.label}
      </p>
      <p className="mt-1 font-semibold text-primary">{item.value}</p>
    </div>
  );
}

function SessionsList({ guest }: { guest: CheckedInGuest }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase text-muted-foreground">
        Reserved Sessions
      </p>
      <ul className="space-y-2">
        {guest.sessions.map((session) => (
          <li
            key={session.title}
            className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm"
          >
            <span className="text-primary">◆</span>
            <span className="font-medium">{session.title}</span>
            <span className="ml-auto text-muted-foreground">{session.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionButtons() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button className="flex-1" type="button">
          PRINT BADGE
        </Button>
        <Button variant="outline" size="icon" type="button">
          <MoreVertical className="size-4" />
        </Button>
      </div>
      <Button variant="outline" className="w-full" type="button">
        UNDO CHECK-IN
      </Button>
    </div>
  );
}
