"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PublicRsvpShell } from "@/components/domain/public-rsvp/public-rsvp-shell";
import { RsvpPageSkeleton } from "@/components/domain/public-rsvp/rsvp-page-skeleton";
import { RsvpThankYou, type RsvpThankYouSummary } from "@/components/domain/public-rsvp/rsvp-thank-you";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type RsvpStatus } from "@/lib/api";

type PublicRsvpInvite = Awaited<ReturnType<typeof api.getPublicRsvp>>;

function guestToThankYouSummary(guest: PublicRsvpInvite["guest"]): RsvpThankYouSummary {
  return {
    guestName: guest.name,
    rsvpStatus: guest.rsvpStatus,
    groupSize: guest.groupSize,
    needsCab: Boolean(guest.needsCab),
    needsHotel: Boolean(guest.needsHotel),
  };
}

function hasCompletedRsvp(invite: PublicRsvpInvite): boolean {
  return Boolean(invite.hasSubmitted) || invite.guest.rsvpStatus !== "PENDING";
}

export default function PublicRsvpPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState<PublicRsvpInvite | null>(null);
  const [submitted, setSubmitted] = useState<RsvpThankYouSummary | null>(null);
  const [editing, setEditing] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>("PENDING");
  const [groupSize, setGroupSize] = useState(1);
  const [pickupLocation, setPickupLocation] = useState("");
  const [needsCab, setNeedsCab] = useState(false);
  const [needsHotel, setNeedsHotel] = useState(false);
  const [guestNotes, setGuestNotes] = useState("");

  useEffect(() => {
    if (!code) return;
    api.getPublicRsvp(code)
      .then((result) => {
        setInvite(result);
        setRsvpStatus(result.guest.rsvpStatus);
        setGroupSize(result.guest.groupSize);
        setPickupLocation(result.guest.pickupLocation || "");
        setNeedsCab(Boolean(result.guest.needsCab));
        setNeedsHotel(Boolean(result.guest.needsHotel));
        setGuestNotes(result.guest.guestNotes || "");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Invalid RSVP link"))
      .finally(() => setLoading(false));
  }, [code]);

  const submit = async () => {
    if (!code || !invite) return;
    setSaving(true);
    try {
      await api.submitPublicRsvp(code, {
        rsvpStatus,
        groupSize,
        pickupLocation: pickupLocation || null,
        needsCab,
        needsHotel,
        guestNotes: guestNotes.trim() || null,
      });
      setSubmitted({
        guestName: invite.guest.name,
        rsvpStatus,
        groupSize,
        needsCab,
        needsHotel,
      });
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit RSVP");
    } finally {
      setSaving(false);
    }
  };

  const thankYouSummary =
    submitted ?? (invite && hasCompletedRsvp(invite) ? guestToThankYouSummary(invite.guest) : null);
  const showThankYou = Boolean(thankYouSummary) && !editing;

  return (
    <PublicRsvpShell>
      {loading ? (
        <RsvpPageSkeleton />
      ) : !invite ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          This RSVP link is invalid or expired.
        </div>
      ) : showThankYou && thankYouSummary ? (
        <RsvpThankYou
          event={invite.event}
          summary={thankYouSummary}
          onEdit={() => setEditing(true)}
        />
      ) : (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">RSVP for {invite.event.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hi {invite.guest.name}, please confirm your attendance.
            </p>
          </div>
          <Select
            value={rsvpStatus}
            onValueChange={(status) => {
              if (status != null) setRsvpStatus(status as RsvpStatus);
            }}
          >
            <SelectTrigger className="w-full justify-between font-normal">
              <SelectValue placeholder="RSVP" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PENDING">Maybe / Pending</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            value={groupSize}
            onChange={(event) => setGroupSize(Number(event.target.value))}
            placeholder="Group size"
          />
          <Input
            value={pickupLocation}
            onChange={(event) => setPickupLocation(event.target.value)}
            placeholder="Pickup location (optional)"
          />
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <Checkbox
              checked={needsCab}
              onChange={(event) => setNeedsCab(event.target.checked)}
            />
            I need cab pickup
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <Checkbox
              checked={needsHotel}
              onChange={(event) => setNeedsHotel(event.target.checked)}
            />
            I need hotel accommodation
          </label>
          <textarea
            className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={guestNotes}
            onChange={(event) => setGuestNotes(event.target.value)}
            placeholder="Notes for the host (dietary needs, arrival time, etc.)"
          />
          <Button
            type="button"
            onClick={() => void submit()}
            loading={saving}
            loadingText="Submitting"
            className="min-h-11 w-full"
          >
            Submit RSVP
          </Button>
        </div>
      )}
    </PublicRsvpShell>
  );
}
