"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { RsvpThankYou, type RsvpThankYouSummary } from "@/components/domain/public-rsvp/rsvp-thank-you";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionDropdown } from "@/components/ui/option-dropdown";
import { api, type RsvpStatus } from "@/lib/api";

export default function PublicRsvpPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState<Awaited<ReturnType<typeof api.getPublicRsvp>> | null>(null);
  const [submitted, setSubmitted] = useState<RsvpThankYouSummary | null>(null);
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit RSVP");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl p-6 text-sm text-muted-foreground">Loading RSVP...</div>
    );
  }

  if (!invite) {
    return (
      <div className="mx-auto max-w-xl p-6 text-sm text-destructive">
        This RSVP link is invalid or expired.
      </div>
    );
  }

  if (submitted) {
    return (
      <RsvpThankYou
        event={invite.event}
        summary={submitted}
        onEdit={() => setSubmitted(null)}
      />
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">RSVP for {invite.event.name}</h1>
      <p className="text-sm text-muted-foreground">
        Hi {invite.guest.name}, please confirm your attendance.
      </p>
      <OptionDropdown
        value={rsvpStatus}
        onValueChange={(status) => setRsvpStatus(status as RsvpStatus)}
        options={[
          { value: "CONFIRMED", label: "Confirmed" },
          { value: "PENDING", label: "Maybe / Pending" },
          { value: "DECLINED", label: "Declined" },
        ]}
        placeholder="RSVP"
      />
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
        <input
          type="checkbox"
          className="size-5 shrink-0"
          checked={needsCab}
          onChange={(event) => setNeedsCab(event.target.checked)}
        />
        I need cab pickup
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 shrink-0"
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
    </main>
  );
}
