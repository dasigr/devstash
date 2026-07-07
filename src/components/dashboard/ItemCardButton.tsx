"use client";

import type { DashboardItem } from "@/lib/db/items";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";

/**
 * Clickable wrapper around an ItemCard. Opens the item drawer for this item
 * instead of navigating — there is no separate item page.
 */
export function ItemCardButton({ item }: { item: DashboardItem }) {
  const { openItem } = useItemDrawer();

  return (
    <button
      type="button"
      onClick={() => openItem(item.id)}
      className="block w-full rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={`Open ${item.title}`}
    >
      <ItemCard item={item} />
    </button>
  );
}
