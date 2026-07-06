import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface NavRowProps {
  href: string;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  icon: React.ReactNode;
  label: string;
  /** Rendered inline, right after the label (e.g. a PRO badge). */
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
}

/** A single sidebar navigation link, collapsing to an icon-only tile. */
export function NavRow({
  href,
  active,
  collapsed,
  onNavigate,
  icon,
  label,
  badge,
  trailing,
}: NavRowProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate">{label}</span>
          {badge}
        </span>
      )}
      {!collapsed && trailing}
    </Link>
  );
}
