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
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AuthGuard>
        <AppShellInner>{children}</AppShellInner>
      </AuthGuard>
    </AppProvider>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[238px] border-r border-border bg-card md:block">
        <Sidebar />
      </aside>

      <TopBar
        mobileMenu={
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 shrink-0 bg-card shadow-sm"
                  />
                }
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
          "min-h-screen bg-background pb-8 md:ml-[238px]",
          pageLayout.shell.headerOffset,
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
