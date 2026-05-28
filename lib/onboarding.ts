import type { AccountMembership } from "@/lib/api";

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

export function needsPlannerOnboarding(
  membership: AccountMembership | null | undefined,
): boolean {
  if (!membership) return false;
  return !membership.onboardingCompletedAt;
}
