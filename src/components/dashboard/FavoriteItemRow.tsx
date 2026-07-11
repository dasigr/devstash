"use client";

import type { DashboardItem } from "@/lib/db/items";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { FavoriteRow } from "@/components/dashboard/FavoriteRow";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";

/** Capitalize a stored type name, e.g. "snippet" -> "Snippet". */
function typeBadge(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * A favorites-list row for an item. Opens the item drawer on click / Enter /
 * Space (no navigation), matching ItemCardButton's role="button" pattern.
 */
export function FavoriteItemRow({ item }: { item: DashboardItem }) {
  const { openItem } = useItemDrawer();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openItem(item.id);
        }
      }}
      className="cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={`Open ${item.title}`}
    >
      <FavoriteRow
        icon={
          <ItemTypeIcon
            name={item.itemType.icon}
            color={item.itemType.color}
            className="size-4"
          />
        }
        title={item.title}
        badge={typeBadge(item.itemType.name)}
        badgeColor={item.itemType.color}
        date={item.updatedAt}
      />
    </div>
  );
}
