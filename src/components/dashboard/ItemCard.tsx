import { Clock, Pin, Star } from "lucide-react";

import { itemTypes, type Item } from "@/lib/mock-data";
import { ItemTypeBadge } from "@/components/dashboard/ItemTypeBadge";

const itemTypeById = new Map(itemTypes.map((type) => [type.id, type]));

/**
 * An item card for the Pinned and Recent sections. The left border is colored
 * to reflect the item's type; a pin (or favorite star) shows in the corner.
 */
export function ItemCard({ item }: { item: Item }) {
  const type = itemTypeById.get(item.itemTypeId);

  return (
    <div
      className="flex flex-col rounded-xl border border-l-4 border-border bg-card p-4 transition-colors hover:border-muted-foreground/30"
      // Left accent reflects the item's type.
      style={type ? { borderLeftColor: type.color } : undefined}
    >
      <div className="flex items-start gap-3">
        {type && <ItemTypeBadge type={type} size="md" />}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">{item.title}</h3>
          <p className="text-xs text-muted-foreground">{type?.name}</p>
        </div>
        {item.isPinned ? (
          <Pin className="size-4 shrink-0 rotate-45 text-muted-foreground" />
        ) : item.isFavorite ? (
          <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />
        ) : null}
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