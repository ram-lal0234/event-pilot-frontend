"use client";

import type { ReactNode } from "react";
import { useApp } from "@/components/providers/app-provider";
import { CreateFirstEventDialog } from "@/components/onboarding/create-first-event-dialog";
import { PlannerProfileDialog } from "@/components/onboarding/planner-profile-dialog";
import { BlockingDialog } from "@/components/onboarding/blocking-dialog";
import { isAccountOwner } from "@/lib/event-access";
import { needsPlannerProfileSetup } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";

/**
 * Enforces planner setup in order: profile → first event (owners) → app.
 * Blocking dialogs cannot be closed until the step is completed.
 */
export function PlannerSetupGuard({ children }: { children: ReactNode }) {
  const { account, membership, events, eventsLoaded, user, logout } = useApp();

  const isOwner = isAccountOwner(membership?.role ?? user.accountRole);
  const needsProfile = needsPlannerProfileSetup(membership, account, isOwner);
  const needsFirstEvent =
    !needsProfile && isOwner && eventsLoaded && events.length === 0;
  const needsEventAssignment =
    !needsProfile && !isOwner && eventsLoaded && events.length === 0;

  const blocked = needsProfile || needsFirstEvent || needsEventAssignment;

  return (
    <>
      <div
        className={blocked ? "pointer-events-none select-none opacity-40" : undefined}
        aria-hidden={blocked}
      >
        {children}
      </div>

      <PlannerProfileDialog open={needsProfile} />
      <CreateFirstEventDialog open={needsFirstEvent} />

      <BlockingDialog
        open={needsEventAssignment}
        title="No events assigned"
        description="Ask your workspace owner to assign you to an event from Team settings."
      >
        <Button type="button" variant="outline" onClick={logout}>
          Logout
        </Button>
      </BlockingDialog>
    </>
  );
}
