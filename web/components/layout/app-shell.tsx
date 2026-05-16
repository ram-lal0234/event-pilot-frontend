"use client";

import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AppProvider, EmptyEventState, useApp } from "@/components/providers/app-provider";
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
    <div className="min-h-screen">
      <div className="hidden md:block">
        <div className="fixed left-0 top-0 z-50 h-screen">
          <Sidebar />
        </div>
      </div>
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Sheet>
          <SheetTrigger
            className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>
      <TopBar />
      <main className="ml-0 min-h-screen bg-background pt-16 md:ml-64">
        <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
