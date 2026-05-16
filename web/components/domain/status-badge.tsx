"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        success: "bg-status-success-bg text-status-success",
        warning: "bg-status-warning-bg text-status-warning",
        error: "bg-status-error-bg text-status-error",
        neutral: "bg-muted text-muted-foreground",
        vip: "bg-accent text-primary",
        speaker: "bg-orange-50 text-orange-600",
        attendee: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export function StatusBadge({
  className,
  variant,
  children,
}: React.ComponentProps<"span"> & VariantProps<typeof statusBadgeVariants>) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
