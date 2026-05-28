import type { AccessLevel, AccountRole, EventRecord } from "@/lib/api";

export function canWriteEvent(
  accountRole: AccountRole | undefined,
  event: EventRecord | null | undefined,
): boolean {
  if (!event) return false;
  if (accountRole === "OWNER") return true;
  return event.accessLevel === "FULL";
}

export function canTriggerVoice(
  accountRole: AccountRole | undefined,
  event: EventRecord | null | undefined,
): boolean {
  if (!canWriteEvent(accountRole, event)) return false;
  return accountRole === "OWNER" || accountRole === "ADMIN";
}

export function isAccountOwner(accountRole: AccountRole | undefined): boolean {
  return accountRole === "OWNER";
}
