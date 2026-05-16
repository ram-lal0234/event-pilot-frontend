"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "eventflow-sidebar-open";

type SidebarContextValue = {
  /** Desktop sidebar (md+) visible */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpenState] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return stored === "true";
      }
    } catch {
      // ignore storage errors (private mode)
    }
    return true;
  });

  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpenState((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
    }),
    [sidebarOpen, setSidebarOpen, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}
