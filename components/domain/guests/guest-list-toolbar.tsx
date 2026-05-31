"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Download, PhoneCall, RefreshCw } from "lucide-react";
import { CallAllPendingButton } from "@/components/domain/guests/call-all-pending-button";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { scopedEventHref } from "@/lib/design-tokens";

type GuestListHeaderActionsProps = {
  currentEventId: string;
  token: string;
  pendingRsvpTotal: number;
  canTriggerVoice: boolean;
  canWrite: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onCallAllQueued: () => void;
  importControl: ReactNode;
  createControl: ReactNode;
};

function RefreshGuestListButton({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            type="button"
            size="icon-sm"
            aria-label="Refresh guest list"
            onClick={onRefresh}
            loading={refreshing}
          >
            <RefreshCw className="size-4" />
          </Button>
        }
      />
      <TooltipContent>Refresh guest list</TooltipContent>
    </Tooltip>
  );
}

export function GuestListHeaderActions({
  currentEventId,
  token,
  pendingRsvpTotal,
  canTriggerVoice,
  canWrite,
  refreshing,
  onRefresh,
  onCallAllQueued,
  importControl,
  createControl,
}: GuestListHeaderActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canTriggerVoice ? (
        <div data-coach="guest-call" className="min-w-0 max-w-full">
          <CallAllPendingButton
            token={token}
            eventId={currentEventId}
            pendingCount={pendingRsvpTotal}
            className="max-w-full gap-2"
            onQueued={onCallAllQueued}
          />
        </div>
      ) : null}
      {canWrite ? (
        <div className="flex shrink-0 items-center gap-2" data-coach="guest-import">
          {importControl}
          {createControl}
          <RefreshGuestListButton refreshing={refreshing} onRefresh={onRefresh} />
        </div>
      ) : (
        <RefreshGuestListButton refreshing={refreshing} onRefresh={onRefresh} />
      )}
    </div>
  );
}

type GuestListSecondaryActionsProps = {
  currentEventId: string;
  exportDisabled: boolean;
  exportBusy: boolean;
  onExport: () => void;
};

export function GuestListSecondaryActions({
  currentEventId,
  exportDisabled,
  exportBusy,
  onExport,
}: GuestListSecondaryActionsProps) {
  const callLogsHref = scopedEventHref(currentEventId, "/call-logs");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        type="button"
        size="sm"
        className="gap-2"
        onClick={onExport}
        disabled={exportDisabled}
        loading={exportBusy}
        loadingText="Exporting"
      >
        <Download className="size-4" />
        Export
      </Button>
      <Button
        variant="outline"
        type="button"
        size="sm"
        className="gap-2"
        render={<Link href={callLogsHref} />}
        nativeButton={false}
      >
        <PhoneCall className="size-4" />
        Call logs
      </Button>
    </div>
  );
}
