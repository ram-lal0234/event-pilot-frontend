"use client";

import { Users } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";

export function NoEventsAssignedScreen() {
  const { logout, account } = useApp();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <Users className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-bold">No events assigned yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask the owner of <strong>{account?.name || "your workspace"}</strong> to assign you to an event from Team
          settings.
        </p>
        <Button className="mt-5" variant="outline" type="button" onClick={logout}>
          Logout
        </Button>
      </div>
    </main>
  );
}
