"use client";

import { Fragment } from "react";
import { ChevronDown, ChevronRight, Link2, Phone } from "lucide-react";
import type { Guest } from "@/types";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function categoryVariant(category: Guest["category"]) {
  switch (category) {
    case "VIP":
      return "vip" as const;
    case "SPEAKER":
      return "speaker" as const;
    default:
      return "attendee" as const;
  }
}

function ExpandedRow({ guest }: { guest: Guest }) {
  return (
    <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
      <TableCell colSpan={7} className="p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">
              Contact Info
            </p>
            {guest.phone && (
              <p className="flex items-center gap-2 text-sm">
                <Phone className="size-4" />
                {guest.phone}
              </p>
            )}
            {guest.linkedIn && (
              <p className="mt-1 flex items-center gap-2 text-sm text-primary">
                <Link2 className="size-4" />
                {guest.linkedIn}
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">
              Dietary Requirements
            </p>
            <DietaryBadges dietary={guest.dietary} />
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">
              Arrival Details
            </p>
            {guest.arrival && (
              <>
                <p className="text-sm font-medium">{guest.arrival.source}</p>
                <p className="text-sm text-muted-foreground">{guest.arrival.time}</p>
                <p className="text-sm text-muted-foreground">
                  {guest.arrival.terminal} · {guest.arrival.gate}
                </p>
              </>
            )}
            <Button variant="outline" size="sm" className="mt-4" type="button">
              Send Reminder Notification
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DietaryBadges({ dietary }: { dietary?: string[] }) {
  if (!dietary?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {dietary.map((d) => (
        <Badge
          key={d}
          variant="outline"
          className="border-amber-200 bg-status-warning-bg text-amber-700"
        >
          {d}
        </Badge>
      ))}
    </div>
  );
}

export function GuestTable({ guests }: { guests: Guest[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Guest Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>RSVP</TableHead>
            <TableHead>Operations</TableHead>
            <TableHead>Check-In</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => (
            <Fragment key={guest.id}>
              <TableRow>
                <TableCell>
                  <input type="checkbox" className="rounded border-border" readOnly />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback>
                        {guest.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-text-main">{guest.name}</p>
                      <p className="text-xs text-muted-foreground">{guest.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge variant={categoryVariant(guest.category)}>
                    {guest.category}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 text-sm">
                    <span
                      className={`size-2 rounded-full ${
                        guest.rsvpStatus === "confirmed"
                          ? "bg-status-success"
                          : "bg-status-warning"
                      }`}
                    />
                    {guest.rsvpStatus === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {guest.operations ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    variant={
                      guest.checkInStatus === "checked-in" ? "success" : "neutral"
                    }
                  >
                    {guest.checkInStatus === "checked-in" ? "CHECKED-IN" : "PENDING"}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  {guest.expanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </TableCell>
              </TableRow>
              {guest.expanded && <ExpandedRow guest={guest} />}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
