"use client";

import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { pageLayout } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PlannerSetupGuard } from "@/components/onboarding/planner-setup-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AppProvider } from "@/components/providers/app-provider";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
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
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppShellInner>{children}</AppShellInner>
      </SidebarProvider>
    </AuthGuard>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useSidebar();

  return (
    <div className="min-h-screen">
      <div
        className={cn(
          "fixed left-0 top-0 z-50 hidden h-screen w-[238px] border-r border-border bg-card transition-transform duration-200 ease-out md:block",
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
                render={<Button variant="outline" size="icon" className="size-9 shrink-0 bg-card shadow-sm" />}
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
          "min-h-screen bg-background pb-8 transition-[margin] duration-200 ease-out",
          pageLayout.shell.headerOffset,
          sidebarOpen ? "md:ml-[238px]" : "md:ml-0",
        )}
      >
        <div
          className={cn(
            "mx-auto",
            pageLayout.shell.maxWidth,
            pageLayout.shell.paddingX,
            pageLayout.shell.paddingTop,
          )}
        >
          <PlannerSetupGuard>{children}</PlannerSetupGuard>
        </div>
      </main>
    </div>
  );
}
