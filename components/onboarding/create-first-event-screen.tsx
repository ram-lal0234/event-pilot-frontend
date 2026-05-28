"use client";

import { useState, type FormEvent } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateFirstEventScreen() {
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
      toast.success("Event created — you're ready to go");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm" onSubmit={(e) => void submit(e)}>
        <div className="mb-5 flex items-center gap-3">
          <CalendarPlus className="size-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Create your first event</h1>
            <p className="text-sm text-muted-foreground">You need one event before using the dashboard.</p>
          </div>
        </div>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" required />
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" required />
        </div>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" type="submit" loading={busy} loadingText="Creating…">
            Create event
          </Button>
          <Button variant="outline" type="button" onClick={logout}>
            Logout
          </Button>
        </div>
      </form>
    </main>
  );
}
