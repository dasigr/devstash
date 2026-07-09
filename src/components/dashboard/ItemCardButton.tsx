"use client";

import type { DashboardItem } from "@/lib/db/items";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";

/**
 * Clickable wrapper around an ItemCard. Opens the item drawer for this item
 * instead of navigating — there is no separate item page.
 *
 * Rendered as a role="button" div (rather than a real <button>) so the card's
 * nested copy <button> stays valid HTML, matching FileListRow; keyboard
 * activation is wired via onKeyDown.
 */
export function ItemCardButton({ item }: { item: DashboardItem }) {
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
      className="block w-full cursor-pointer rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={`Open ${item.title}`}
    >
      <ItemCard item={item} />
    </div>
  );
}
