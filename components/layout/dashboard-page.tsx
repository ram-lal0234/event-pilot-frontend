import type { ReactNode } from "react";
import { PageHeader } from "@/components/domain/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { pageLayout } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type DashboardPageProps = {
  title: string;
  description?: string;
  breadcrumb?: string;
  actions?: ReactNode;
  /** Match dashboard home (`loose`) or standard ops pages (`default`). */
  spacing?: keyof typeof pageLayout.spacing;
  className?: string;
  children: ReactNode;
};

/**
 * Standard dashboard body wrapper. Horizontal padding comes from AppShell only —
 * do not add `p-4` / `p-6` on individual pages.
 */
export function DashboardPage({
  title,
  description,
  breadcrumb,
  actions,
  spacing = "default",
  className,
  children,
}: DashboardPageProps) {
  return (
    <div className={cn(pageLayout.spacing[spacing], className)}>
      <PageHeader
        breadcrumb={breadcrumb}
        title={title}
        description={description}
        actions={actions}
      />
      {children}
    </div>
  );
}

export function DashboardPageSkeleton({
  spacing = "default",
  cards = 1,
}: {
  spacing?: keyof typeof pageLayout.spacing;
  cards?: number;
}) {
  return (
    <div className={cn(pageLayout.spacing[spacing])}>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {Array.from({ length: cards }).map((_, index) => (
        <Skeleton key={index} className="h-36 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** Bordered card block used on profile, settings-style pages. */
export function PageSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "max-w-lg space-y-4 rounded-lg border border-border bg-card p-4 md:p-5",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
