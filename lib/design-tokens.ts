import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  LayoutDashboard,
  PhoneForwarded,
  ScanLine,
  Truck,
  Users,
} from "lucide-react";

export const brand = {
  name: "EventPilot AI",
  tagline: "CamRSVP",
} as const;

/** Shell + page spacing — single source for dashboard layout rhythm. */
export const pageLayout = {
  shell: {
    maxWidth: "max-w-[1640px]",
    paddingX: "px-4 lg:px-6",
    paddingTop: "pt-6",
    headerOffset: "pt-14",
  },
  spacing: {
    default: "space-y-6",
    loose: "space-y-7",
    tight: "space-y-4",
  },
} as const;

export const colors = {
  primary: "#3525cd",
  primaryContainer: "#4f46e5",
  background: "#f8f9fa",
  surface: "#ffffff",
  borderSubtle: "#E5E7EB",
  textMain: "#333333",
  onSurfaceVariant: "#464555",
  success: "#00CA72",
  successBg: "#E6F9F1",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  error: "#EF4444",
  errorBg: "#FEF2F2",
} as const;

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Guests", href: "/guests", icon: Users },
  { label: "Follow-up", href: "/follow-up", icon: PhoneForwarded },
  { label: "Operations", href: "/operations", icon: Truck },
  { label: "Check-In", href: "/check-in", icon: ScanLine },
];

export const eventViewItems = [
  { label: "Live View", href: "/live" },
  { label: "Analytics", href: "/analytics" },
  { label: "Reports", href: "/reports" },
  { label: "Call Logs", href: "/call-logs" },
] as const;

/** Routes that are workspace-level, not tied to the selected event. */
const GLOBAL_NAV_HREFS = new Set(["/events", "/team", "/profile"]);

export function scopedEventHref(eventId: string, href: string) {
  if (GLOBAL_NAV_HREFS.has(href)) return href;
  if (!eventId) return href;
  if (href === "/") return `/events/${eventId}/dashboard`;
  return `/events/${eventId}${href}`;
}

export function isEventHrefActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || /^\/events\/[^/]+\/dashboard$/.test(pathname);
  }

  if (href === "/events") {
    return pathname === "/events";
  }

  return pathname === href || new RegExp(`^/events/[^/]+${href}$`).test(pathname);
}
