"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
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

export function CreateEventSheet({ trigger }: { trigger: ReactElement }) {
  const { createEvent } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await createEvent({ name, date, location });
      setName("");
      setDate("");
      setLocation("");
      setOpen(false);
      toast.success("Event created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="sm:max-w-md">
        <form className="flex h-full flex-col" onSubmit={submit}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CalendarPlus className="size-5 text-primary" />
              Create Event
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block space-y-1 text-sm font-medium">
              <span>Name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Date</span>
              <Input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Location</span>
              <Input value={location} onChange={(event) => setLocation(event.target.value)} required />
            </label>
          </div>
          <SheetFooter>
            <Button type="submit" loading={busy} loadingText="Creating event">Create Event</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
