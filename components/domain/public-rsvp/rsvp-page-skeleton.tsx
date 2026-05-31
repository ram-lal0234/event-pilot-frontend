import { Skeleton } from "@/components/ui/skeleton";

export function RsvpPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading RSVP">
      <Skeleton className="h-8 w-4/5 max-w-sm" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <div className="space-y-3 pt-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-44" />
      </div>
      <Skeleton className="min-h-24 w-full rounded-md" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}
