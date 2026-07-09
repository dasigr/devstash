import { Clock, Pin, Star } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { ItemTypeBadge } from "@/components/dashboard/ItemTypeBadge";

/**
 * An item card for the Pinned and Recent sections. The left border is colored
 * to reflect the item's type; a pin (or favorite star) shows in the corner,
 * alongside a quick-copy control for the item's content.
 */
export function ItemCard({ item }: { item: DashboardItem }) {
  const type = item.itemType;

  return (
    <div
      className="flex flex-col rounded-xl border border-l-4 border-border bg-card p-4 transition-colors hover:border-muted-foreground/30"
      // Left accent reflects the item's type.
      style={{ borderLeftColor: type.color }}
    >
      <div className="flex items-start gap-3">
        <ItemTypeBadge type={type} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">{item.title}</h3>
          <p className="text-xs text-muted-foreground">{type.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.isPinned ? (
            <Pin className="size-4 rotate-45 text-muted-foreground" />
          ) : item.isFavorite ? (
            <Star className="size-4 fill-amber-400 text-amber-400" />
          ) : null}
          {item.preview && (
            <CopyButton value={item.preview} label={`Copy ${item.title}`} />
          )}
        </div>
      </div>

      <div className="mt-3 line-clamp-2 rounded-md bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
        {item.preview}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="truncate rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {item.updatedAt}
        </span>
      </div>
    </div>
  );
}