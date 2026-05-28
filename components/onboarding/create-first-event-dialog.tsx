"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { BlockingDialog } from "@/components/onboarding/blocking-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formLimits } from "@/lib/form-limits";

type CreateFirstEventDialogProps = {
  open: boolean;
};

export function CreateFirstEventDialog({ open }: CreateFirstEventDialogProps) {
  const { createEvent, logout } = useApp();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await createEvent({ name, date, location });
      toast.success("Event created — welcome to your dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BlockingDialog
      open={open}
      title="Create your first event"
      description="Account owners need at least one event before using the dashboard. This step cannot be skipped."
    >
      <form className="space-y-3" onSubmit={(e) => void submit(e)}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Event name"
          required
          minLength={formLimits.eventName.minLength}
          maxLength={formLimits.eventName.maxLength}
        />
        <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          required
          minLength={formLimits.location.minLength}
          maxLength={formLimits.location.maxLength}
        />
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" type="submit" loading={busy} loadingText="Creating…">
            Create event
          </Button>
          <Button type="button" variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </form>
    </BlockingDialog>
  );
}
