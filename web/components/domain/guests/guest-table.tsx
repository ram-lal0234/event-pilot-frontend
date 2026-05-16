"use client";

import { Fragment } from "react";
import { ChevronRight, MapPin, Phone, Radio } from "lucide-react";
import type { GuestRecord } from "@/lib/api";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function categoryVariant(category: GuestRecord["category"]) {
  switch (category) {
    case "VIP":
      return "vip" as const;
    default:
      return "attendee" as const;
  }
}

function ExpandedRow({
  guest,
  onTriggerIvr,
}: {
  guest: GuestRecord;
  onTriggerIvr: (guestId: string) => void;
}) {
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
            <p className="mt-1 text-sm text-muted-foreground">{guest.email || "No email"}</p>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">
              Pickup
            </p>
            <p className="flex items-center gap-2 text-sm">
              <MapPin className="size-4" />
              {guest.pickupLocation || "Not provided"}
            </p>
            {guest.pickupLat && guest.pickupLng && (
              <p className="mt-1 text-sm text-muted-foreground">
                {guest.pickupLat}, {guest.pickupLng}
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">
              IVR and QR
            </p>
            <p className="text-sm text-muted-foreground">
              {guest.ivrRespondedAt ? `Responded ${new Date(guest.ivrRespondedAt).toLocaleString()}` : "No IVR response yet"}
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-2" type="button" onClick={() => onTriggerIvr(guest.id)}>
              <Radio className="size-4" />
              Trigger IVR
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function GuestTable({
  guests,
  onTriggerIvr,
}: {
  guests: GuestRecord[];
  onTriggerIvr: (guestId: string) => void;
}) {
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
                        guest.rsvpStatus === "CONFIRMED"
                          ? "bg-status-success"
                          : "bg-status-warning"
                      }`}
                    />
                    {guest.rsvpStatus}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  Group {guest.groupSize} · {guest.pickupLocation || "No pickup"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    variant={
                      guest.checkins?.length ? "success" : "neutral"
                    }
                  >
                    {guest.checkins?.length ? "CHECKED-IN" : "PENDING"}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
              <ExpandedRow guest={guest} onTriggerIvr={onTriggerIvr} />
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
