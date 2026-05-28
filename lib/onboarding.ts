import type { AccountInfo, AccountMembership } from "@/lib/api";

export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] || "";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function defaultWorkspaceName(email: string): string {
  const name = displayNameFromEmail(email);
  return name ? `${name} Events` : "My Workspace";
}

export function isProfileIncomplete(
  membership: AccountMembership | null | undefined,
  account: AccountInfo | null | undefined,
  isOwner: boolean,
): boolean {
  if (!membership) return true;

  const nameOk = Boolean(membership.name?.trim() && membership.name.trim().length >= 2);
  const phoneOk = Boolean(membership.phone?.trim() && membership.phone.trim().length >= 8);
  const workspaceOk =
    !isOwner || Boolean(account?.name?.trim() && account.name.trim().length >= 2);

  return !nameOk || !phoneOk || !workspaceOk;
}

/** True when planner must complete the profile dialog (not closable). */
export function needsPlannerProfileSetup(
  membership: AccountMembership | null | undefined,
  account: AccountInfo | null | undefined,
  isOwner: boolean,
): boolean {
  if (!membership) return true;
  if (!membership.onboardingCompletedAt) return true;
  return isProfileIncomplete(membership, account, isOwner);
}

/** @deprecated Use needsPlannerProfileSetup */
export function needsPlannerOnboarding(
  membership: AccountMembership | null | undefined,
): boolean {
  if (!membership) return false;
  return !membership.onboardingCompletedAt;
}
