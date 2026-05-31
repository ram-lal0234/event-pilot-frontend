import type { AccountRole } from "@/lib/api";

const PLANNER_ROLES: AccountRole[] = ["OWNER", "ADMIN", "STAFF"];
const FIELD_ROLES: AccountRole[] = ["DRIVER", "HOTEL"];

export function isPlannerRole(role: AccountRole | undefined): boolean {
  return Boolean(role && PLANNER_ROLES.includes(role));
}

export function isFieldRole(role: AccountRole | undefined): boolean {
  return Boolean(role && FIELD_ROLES.includes(role));
}

export function isDriverRole(role: AccountRole | undefined): boolean {
  return role === "DRIVER";
}

export function isHotelRole(role: AccountRole | undefined): boolean {
  return role === "HOTEL";
}

export const fieldRoleHomePath: Partial<Record<AccountRole, string>> = {
  DRIVER: "/fieldops/drivers",
  HOTEL: "/fieldops/hotel-desk",
};

/** Planner-only dashboard sections (field roles use /fieldops/*). */
export const plannerOnlyPathPrefixes = [
  "/guests",
  "/whatsapp",
  "/follow-up",
  "/operations",
  "/check-in",
  "/live",
  "/analytics",
  "/reports",
  "/call-logs",
  "/team",
];

export function isPlannerOnlyPath(pathname: string): boolean {
  if (pathname === "/" || /^\/events\/[^/]+\/dashboard$/.test(pathname)) {
    return true;
  }

  return plannerOnlyPathPrefixes.some(
    (prefix) =>
      pathname === prefix || new RegExp(`^/events/[^/]+${prefix}$`).test(pathname),
  );
}

export function canAccessPath(role: AccountRole | undefined, pathname: string): boolean {
  if (!role || isPlannerRole(role)) return true;

  if (role === "DRIVER") {
    return (
      pathname.startsWith("/fieldops/drivers") ||
      pathname === "/profile" ||
      pathname === "/events"
    );
  }

  if (role === "HOTEL") {
    return (
      pathname.startsWith("/fieldops/hotel-desk") ||
      pathname.startsWith("/fieldops/checkin") ||
      pathname === "/profile" ||
      pathname === "/events"
    );
  }

  return false;
}
