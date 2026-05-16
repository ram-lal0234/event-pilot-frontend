"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { brand, isEventHrefActive, navItems, scopedEventHref } from "@/lib/design-tokens";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { CreateEventSheet } from "@/components/domain/events/create-event-sheet";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { currentEventId } = useApp();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card py-6",
        className
      )}
    >
      <div className="mb-8 flex items-center gap-3 px-4">
        <div className="flex size-8 items-center justify-center rounded bg-primary">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-none text-primary">
            {brand.name}
          </h1>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground opacity-70">
            {brand.tagline}
          </p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = isEventHrefActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={scopedEventHref(currentEventId, item.href)}
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-r-2 border-primary bg-surface-container-low font-semibold text-primary"
                  : "text-muted-foreground hover:bg-surface-container-low hover:text-foreground"
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4">
        <CreateEventSheet
          trigger={
            <Button className="w-full gap-2" type="button">
              <CalendarPlus className="size-4" />
              Create Event
            </Button>
          }
        />
      </div>
    </aside>
  );
}
