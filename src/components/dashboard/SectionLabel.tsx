import * as React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  collapsed: boolean;
  action?: React.ReactNode;
}

/** A sidebar section heading; collapses to a divider on the icon-only rail. */
export function SectionLabel({ children, collapsed, action }: SectionLabelProps) {
  if (collapsed) {
    return <div className="mx-3 my-2 border-t border-border" />;
  }
  return (
    <div className="flex items-center justify-between px-3 pt-4 pb-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
        {children}
      </p>
      {action}
    </div>
  );
}
