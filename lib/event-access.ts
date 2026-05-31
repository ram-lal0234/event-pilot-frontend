import type { AccessLevel, AccountRole, EventRecord } from "@/lib/api";
import { isFieldRole, isPlannerRole } from "@/lib/role-capabilities";

export function canWriteEvent(
  accountRole: AccountRole | undefined,
  event: EventRecord | null | undefined,
): boolean {
  if (!event) return false;
  if (isFieldRole(accountRole)) return event.accessLevel === "FULL";
  if (accountRole === "OWNER") return true;
  return event.accessLevel === "FULL";
}

export function canManageGuests(accountRole: AccountRole | undefined): boolean {
  return isPlannerRole(accountRole);
}

export function canManageOperations(accountRole: AccountRole | undefined): boolean {
  return isPlannerRole(accountRole);
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
