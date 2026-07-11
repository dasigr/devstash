import * as React from "react";

interface FavoriteRowProps {
  icon: React.ReactNode;
  title: string;
  /** Short type label shown as a badge, e.g. "Snippet" or "Collection". */
  badge: string;
  /** Accent color for the badge (item-type color, or a neutral gray). */
  badgeColor: string;
  /** Relative date shown at the trailing edge, e.g. "2h ago". */
  date: string;
}

/**
 * One dense, terminal-style favorites row: leading type icon, title, a small
 * type badge, and a trailing relative date. Presentational only — the item and
 * collection wrappers add the click behavior (drawer vs. navigation).
 */
export function FavoriteRow({
  icon,
  title,
  badge,
  badgeColor,
  date,
}: FavoriteRowProps) {
  return (
    <div className="group flex items-center gap-3 rounded px-2 py-1.5 font-mono text-sm transition-colors hover:bg-muted/50">
      <span className="flex size-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-foreground">{title}</span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase"
        // Colors are data-driven (per item type), so they must be inline.
        style={{ color: badgeColor, backgroundColor: `${badgeColor}1a` }}
      >
        {badge}
      </span>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {date}
      </span>
    </div>
  );
}
