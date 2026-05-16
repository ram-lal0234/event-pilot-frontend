"use client";

import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AppProvider, EmptyEventState, useApp } from "@/components/providers/app-provider";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </AppProvider>
  );
}

function AuthenticatedShell({ children }: { children: ReactNode }) {
  const { currentEvent } = useApp();

  if (!currentEvent) {
    return <EmptyEventState />;
  }

  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useSidebar();

  return (
    <div className="min-h-screen">
      <div
        className={cn(
          "fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-border bg-card transition-transform duration-200 ease-out md:block",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar />
      </div>

      <TopBar
        mobileMenu={
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card shadow-sm"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(18rem,calc(100vw-2rem))] max-w-none p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </div>
        }
      />

      <main
        className={cn(
          "min-h-screen bg-background pb-8 pt-14 transition-[margin] duration-200 ease-out sm:pt-16",
          sidebarOpen ? "md:ml-64" : "md:ml-0"
        )}
      >
        <div className="mx-auto max-w-[1440px] px-3 sm:px-4 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
