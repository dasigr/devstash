"use client";

import type { DashboardItem } from "@/lib/db/items";
import { ImageCard } from "@/components/dashboard/ImageCard";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";

/**
 * Clickable wrapper around an ImageCard. Opens the item drawer for this item
 * instead of navigating. Acts as the `group` that drives the thumbnail's
 * hover-zoom effect.
 */
export function ImageCardButton({ item }: { item: DashboardItem }) {
  const { openItem } = useItemDrawer();

  return (
    <button
      type="button"
      onClick={() => openItem(item.id)}
      className="group block w-full rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={`Open ${item.title}`}
    >
      <ImageCard item={item} />
    </button>
  );
}
