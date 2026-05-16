"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Download, FileUp, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/domain/page-header";
import { GuestTable } from "@/components/domain/guests/guest-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api, type GuestCategory, type GuestRecord } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

const emptyGuest = {
  name: "",
  phone: "",
  email: "",
  category: "GENERAL" as GuestCategory,
  groupSize: 1,
  pickupLocation: "",
  pickupLat: "",
  pickupLng: "",
};

export default function GuestsPage() {
  const { token, currentEventId, currentEvent } = useApp();
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [guestForm, setGuestForm] = useState(emptyGuest);
  const [csv, setCsv] = useState("name,phone,email,category,group_size,pickup_location\n");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadGuests = useCallback(async () => {
    if (!currentEventId) return;
    try {
      setGuests(await api.listGuests(token, currentEventId));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load guests");
    }
  }, [currentEventId, token]);

  useEffect(() => {
    void Promise.resolve().then(loadGuests);
  }, [loadGuests]);

  const stats = useMemo(
    () => ({
      total: guests.length,
      checkedIn: guests.filter((guest) => guest.checkins?.length).length,
      pending: guests.filter((guest) => guest.rsvpStatus === "PENDING").length,
    }),
    [guests]
  );

  const addGuest = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.createGuest(token, {
        eventId: currentEventId,
        name: guestForm.name,
        phone: guestForm.phone,
        email: guestForm.email || undefined,
        category: guestForm.category,
        groupSize: Number(guestForm.groupSize),
        pickupLocation: guestForm.pickupLocation || undefined,
        pickupLat: guestForm.pickupLat ? Number(guestForm.pickupLat) : undefined,
        pickupLng: guestForm.pickupLng ? Number(guestForm.pickupLng) : undefined,
      });
      setGuestForm(emptyGuest);
      setMessage("Guest created");
      await loadGuests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create guest");
    } finally {
      setBusy(false);
    }
  };

  const uploadCsv = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api.uploadGuestCsv(token, currentEventId, csv);
      setMessage(`${result.inserted} guests imported`);
      await loadGuests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload CSV");
    } finally {
      setBusy(false);
    }
  };

  const triggerIvr = async (guestId: string) => {
    try {
      await api.triggerIvr(token, guestId);
      setMessage("IVR job queued");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue IVR");
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb={`EVENTS / ${currentEvent?.name || "SELECTED EVENT"}`}
        title="Guest Management"
        actions={
          <>
            <Button variant="outline" type="button" className="gap-2" onClick={loadGuests}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" type="button" className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
            <CsvSheet csv={csv} setCsv={setCsv} uploadCsv={uploadCsv} busy={busy} />
            <GuestSheet
              form={guestForm}
              setForm={setGuestForm}
              onSubmit={addGuest}
              busy={busy}
            />
          </>
        }
      />
      {message && <p className="mb-3 rounded-md bg-status-success-bg p-3 text-sm text-status-success">{message}</p>}
      {error && <p className="mb-3 rounded-md bg-status-error-bg p-3 text-sm text-status-error">{error}</p>}
      <GuestTable guests={guests} onTriggerIvr={triggerIvr} />
      <GuestFooter stats={stats} />
    </div>
  );
}

function GuestSheet({
  form,
  setForm,
  onSubmit,
  busy,
}: {
  form: typeof emptyGuest;
  setForm: (form: typeof emptyGuest) => void;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" />
        Add Guest
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form className="flex h-full flex-col" onSubmit={onSubmit}>
          <SheetHeader>
            <SheetTitle>Add Guest</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" required />
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" required />
            <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" />
            <select
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value as GuestCategory })}
            >
              <option value="GENERAL">General</option>
              <option value="FAMILY">Family</option>
              <option value="VIP">VIP</option>
            </select>
            <Input type="number" min={1} value={form.groupSize} onChange={(event) => setForm({ ...form, groupSize: Number(event.target.value) })} placeholder="Group size" />
            <Input value={form.pickupLocation} onChange={(event) => setForm({ ...form, pickupLocation: event.target.value })} placeholder="Pickup location" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={form.pickupLat} onChange={(event) => setForm({ ...form, pickupLat: event.target.value })} placeholder="Lat" />
              <Input value={form.pickupLng} onChange={(event) => setForm({ ...form, pickupLng: event.target.value })} placeholder="Lng" />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" disabled={busy}>Create Guest</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CsvSheet({
  csv,
  setCsv,
  uploadCsv,
  busy,
}: {
  csv: string;
  setCsv: (csv: string) => void;
  uploadCsv: () => void;
  busy: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium"
      >
        <FileUp className="size-4" />
        CSV
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Upload Guest CSV</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <textarea
            className="min-h-72 w-full rounded-lg border border-input bg-transparent p-3 font-mono text-sm"
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
          />
        </div>
        <SheetFooter>
          <Button type="button" onClick={uploadCsv} disabled={busy}>Import CSV</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function GuestFooter({
  stats,
}: {
  stats: { total: number; checkedIn: number; pending: number };
}) {
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <span>Total Guests: <strong>{stats.total.toLocaleString()}</strong></span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-status-success" />
          Checked-in: <strong>{stats.checkedIn}</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-status-warning" />
          Pending RSVP: <strong>{stats.pending}</strong>
        </span>
      </div>
    </div>
  );
}
