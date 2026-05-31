import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bed,
  CalendarDays,
  Car,
  FileText,
  LayoutDashboard,
  PhoneCall,
  PhoneForwarded,
  Radio,
  MessageCircle,
  ScanLine,
  Truck,
  Users,
} from "lucide-react";

export const brand = {
  name: "EventPilot AI",
  tagline: "CamRSVP",
  logo: "/event-pilot-logo.png",
  favicon: "/logos/favicon.ico",
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

/** Ivory & Saffron — warm ivory surfaces, saffron primary, forest/red status. */
export const colors = {
  ivory: "#FCFBF7",
  saffron: "#B35900",
  saffronLight: "#D4781A",
  saffronDark: "#8F4500",
  saffronDeep: "#5C2D00",
  forest: "#1B5E20",
  alert: "#D32F2F",
  primary: "#B35900",
  primaryContainer: "#D4781A",
  background: "#FCFBF7",
  surface: "#FFFFFF",
  borderSubtle: "#E8E2D6",
  textMain: "#2C2419",
  onSurfaceVariant: "#5C5348",
  success: "#1B5E20",
  successBg: "#E8F5E9",
  warning: "#B35900",
  warningBg: "#FFF4E6",
  error: "#D32F2F",
  errorBg: "#FFEBEE",
} as const;

/** Login-only gradients and hero preview surfaces. */
export const loginTheme = {
  pageGradient:
    "linear-gradient(135deg, #3d2814 0%, #6b3f1a 28%, #b35900 55%, #d4781a 78%, #f5e6c8 100%)",
  pageGlow:
    "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(243, 229, 171, 0.35) 0%, transparent 55%)",
  heroGradient:
    "linear-gradient(155deg, #2a1a0e 0%, #5c2d00 22%, #8f4500 48%, #b35900 72%, #d4781a 100%)",
  /** Deep saffron anchor (login accents) */
  heroSolid: "#5c2d00",
  goldGradient: "linear-gradient(90deg, #d9a74a 0%, #f3e5ab 100%)",
  previewCard: "#0f1117",
  previewMuted: "#9ca3af",
  previewLive: "#1b4332",
} as const;

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Guests", href: "/guests", icon: Users },
  { label: "WhatsApp (Beta)", href: "/whatsapp", icon: MessageCircle },
  { label: "Follow-up", href: "/follow-up", icon: PhoneForwarded },
  { label: "Operations", href: "/operations", icon: Truck },
  { label: "Check-In", href: "/check-in", icon: ScanLine },
];

export const eventViewItems: NavItem[] = [
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Live", href: "/live", icon: Radio },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Call Logs", href: "/call-logs", icon: PhoneCall },
];

export const driverNavItems: NavItem[] = [
  { label: "Driver roster", href: "/fieldops/drivers", icon: Car },
];

export const hotelNavItems: NavItem[] = [
  { label: "Hotel desk", href: "/fieldops/hotel-desk", icon: Bed },
  { label: "Hotel check-in", href: "/fieldops/checkin", icon: ScanLine },
];

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

  if (href === "/profile" || href === "/team") {
    return pathname === href;
  }

  return pathname === href || new RegExp(`^/events/[^/]+${href}$`).test(pathname);
}
