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
  /** Hide breadcrumb + title block (e.g. profile uses its own hero). */
  hideHeader?: boolean;
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
  hideHeader = false,
  className,
  children,
}: DashboardPageProps) {
  return (
    <div className={cn(pageLayout.spacing[spacing], className)}>
      {hideHeader ? (
        <h1 className="sr-only">{title}</h1>
      ) : (
        <PageHeader
          breadcrumb={breadcrumb}
          title={title}
          description={description}
          actions={actions}
        />
      )}
      {children}
    </div>
  );
}

export type DashboardPageSkeletonVariant =
  | "blocks"
  | "card-grid"
  | "list"
  | "dashboard-home"
  | "guests-table"
  | "follow-up";

function FollowUpCardSkeleton() {
  return (
    <div className="flex h-full min-h-[13.5rem] flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 max-w-[9rem]" />
          <Skeleton className="h-3 w-1/2 max-w-[6rem]" />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <Skeleton className="h-5 w-[5.5rem] rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-4 flex-1" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-[5.5rem] rounded-md" />
          <Skeleton className="h-8 w-[7.25rem] rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton({
  spacing = "default",
  cards = 1,
  hideHeader = false,
  variant = "blocks",
}: {
  spacing?: keyof typeof pageLayout.spacing;
  cards?: number;
  hideHeader?: boolean;
  variant?: DashboardPageSkeletonVariant;
}) {
  const header = !hideHeader ? (
    variant === "follow-up" ? (
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
      </div>
    ) : (
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
    )
  ) : null;

  return (
    <div className={cn(pageLayout.spacing[spacing])}>
      {header}

      {variant === "dashboard-home" ? (
        <div className="space-y-7">
          <Skeleton className="h-9 w-56" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Skeleton className="h-[4.25rem] rounded-lg" />
            <Skeleton className="h-[4.25rem] rounded-lg" />
          </div>
          <div className="flex flex-col gap-3 xl:flex-row">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-52 min-w-0 flex-1 rounded-lg" />
            ))}
          </div>
        </div>
      ) : null}

      {variant === "card-grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cards }).map((_, index) => (
            <Skeleton key={index} className="h-52 w-full rounded-lg" />
          ))}
        </div>
      ) : null}

      {variant === "list" ? (
        <div className="space-y-3">
          {Array.from({ length: cards }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : null}

      {variant === "follow-up" ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: cards }).map((_, index) => (
              <FollowUpCardSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : null}

      {variant === "guests-table" ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-24" />
              ))}
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="space-y-3 border-b border-border px-4 py-3">
            <Skeleton className="h-8 w-full max-w-64" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-20" />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-4 border-b border-border p-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid grid-cols-7 gap-4 p-4">
                {Array.from({ length: 7 }).map((__, cellIndex) => (
                  <Skeleton key={cellIndex} className="h-8 w-full" />
                ))}
              </div>
            ))}
          </div>
          <Skeleton className="m-4 h-14 rounded-lg" />
        </div>
      ) : null}

      {variant === "blocks"
        ? Array.from({ length: cards }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-lg" />
          ))
        : null}
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
