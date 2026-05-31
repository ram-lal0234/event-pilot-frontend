"use client";

import { useApp } from "@/components/providers/app-provider";
import {
  canManageOperations,
  canTriggerVoice,
  canWriteEvent,
  isAccountOwner,
} from "@/lib/event-access";

export function useEventAccess() {
  const { user, currentEvent, account } = useApp();
  const accountRole = user.accountRole;

  return {
    account,
    accountRole,
    isOwner: isAccountOwner(accountRole),
    canWrite: canWriteEvent(accountRole, currentEvent),
    canTriggerVoice: canTriggerVoice(accountRole, currentEvent),
    canManageOperations: canManageOperations(accountRole),
  };
}
