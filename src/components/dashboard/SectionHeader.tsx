import * as React from "react";

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  /** Optional trailing content, e.g. a "View all" link. */
  action?: React.ReactNode;
}

/** Shared heading for the dashboard's main sections (Collections, Pinned, Recent). */
export function SectionHeader({ icon, title, count, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex size-4 items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <span className="rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
        {count}
      </span>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}