"use client";

import { BrandLogo } from "@/components/brand-logo";
import { brand } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type WorkspaceBootstrapScreenProps = {
  message?: string;
  className?: string;
};

/**
 * Full-screen bootstrap loader (Razorpay-style): centered logo, subtle pulse, indeterminate bar.
 */
export function WorkspaceBootstrapScreen({
  message = "Loading your workspace",
  className,
}: WorkspaceBootstrapScreenProps) {
  return (
    <main
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgb(179_89_0/0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_40%,rgb(212_120_26/0.12),transparent_55%)]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        <div className="animate-workspace-bootstrap-pulse">
          <BrandLogo priority imageClassName="h-[4.5rem] w-auto sm:h-20" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-base font-semibold tracking-tight text-foreground">{brand.name}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="h-0.5 w-36 overflow-hidden rounded-full bg-border sm:w-44">
          <div className="h-full w-1/2 rounded-full bg-primary animate-workspace-bootstrap-bar" />
        </div>
      </div>
    </main>
  );
}
