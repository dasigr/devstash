"use client";

import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/dashboard/sidebar-context";

/** Collapses the desktop rail / opens the mobile drawer. Lives in the top bar. */
export function SidebarToggle() {
  const { toggle } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle sidebar"
    >
      <PanelLeft className="size-4" />
    </Button>
  );
}