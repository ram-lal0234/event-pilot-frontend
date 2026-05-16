import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Truck,
  ScanLine,
} from "lucide-react";

export const brand = {
  name: "EventPilot AI",
  tagline: "CamRSVP",
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
  { label: "Guests", href: "/guests", icon: Users },
  { label: "Operations", href: "/operations", icon: Truck },
  { label: "Check-In", href: "/check-in", icon: ScanLine },
];
