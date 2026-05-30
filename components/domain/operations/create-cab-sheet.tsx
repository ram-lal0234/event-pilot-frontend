"use client";

import { useState, type FormEvent } from "react";
import { Car, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";

const initialForm = {
  driverName: "",
  driverPhone: "",
  vehicleNumber: "",
  capacity: 4,
  routeZone: "",
  tripStatus: "",
  pickupTime: "",
};

export function CreateCabSheet({
  eventId,
  token,
  onCreated,
}: {
  eventId: string;
  token: string;
  onCreated: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.createCab(token, {
        eventId,
        ...form,
        capacity: Number(form.capacity),
        pickupTime: form.pickupTime ? new Date(form.pickupTime).toISOString() : undefined,
      });
      setForm(initialForm);
      setOpen(false);
      toast.success("Cab created");
      await onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create cab");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button className="h-9 gap-2 rounded-md bg-foreground px-4 text-background hover:bg-foreground/90" type="button" />
        }
      >
        <Plus className="size-4" />
        Create Cab
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Car className="size-5 text-primary" />
              Create Cab
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <label className="block space-y-1 text-sm font-medium">
              <span>Driver</span>
              <Input
                value={form.driverName}
                onChange={(event) => setForm({ ...form, driverName: event.target.value })}
                placeholder="Driver name"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Driver phone</span>
              <Input
                value={form.driverPhone}
                onChange={(event) => setForm({ ...form, driverPhone: event.target.value })}
                placeholder="Phone number"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Vehicle</span>
              <Input
                value={form.vehicleNumber}
                onChange={(event) => setForm({ ...form, vehicleNumber: event.target.value })}
                placeholder="Vehicle number or model"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Pickup time</span>
              <Input
                type="datetime-local"
                value={form.pickupTime}
                onChange={(event) => setForm({ ...form, pickupTime: event.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Route / zone</span>
              <Input
                value={form.routeZone}
                onChange={(event) => setForm({ ...form, routeZone: event.target.value })}
                placeholder="Route or zone"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Trip status</span>
              <Input
                value={form.tripStatus}
                onChange={(event) => setForm({ ...form, tripStatus: event.target.value })}
                placeholder="e.g. Available"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Capacity</span>
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })}
                required
              />
            </label>
          </SheetBody>
          <SheetFooter>
            <Button type="submit" loading={busy} loadingText="Creating cab">
              Create Cab
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
