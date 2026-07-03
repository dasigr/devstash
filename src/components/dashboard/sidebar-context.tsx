"use client";

import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarContextValue {
  /** Desktop icon-only rail state. */
  collapsed: boolean;
  /** Mobile drawer open state. */
  mobileOpen: boolean;
  isMobile: boolean;
  /** Collapses the rail on desktop, opens/closes the drawer on mobile. */
  toggle: () => void;
  closeMobile: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggle = React.useCallback(() => {
    if (isMobile) {
      setMobileOpen((open) => !open);
    } else {
      setCollapsed((c) => !c);
    }
  }, [isMobile]);

  const closeMobile = React.useCallback(() => setMobileOpen(false), []);

  const value = React.useMemo<SidebarContextValue>(
    () => ({ collapsed, mobileOpen, isMobile, toggle, closeMobile }),
    [collapsed, mobileOpen, isMobile, toggle, closeMobile]
  );

  return <SidebarContext value={value}>{children}</SidebarContext>;
}