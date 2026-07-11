"use client";

import { Star } from "lucide-react";

import { setItemFavorite } from "@/actions/items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/components/dashboard/useFavoriteToggle";

/**
 * A star button that toggles an item's favorite state. Used in the item drawer's
 * action bar and, with `stopPropagation`, on the item card (where a raw click
 * would otherwise open the drawer — same guard as CopyButton).
 */
export function ItemFavoriteButton({
  itemId,
  isFavorite,
  size = "icon",
  stopPropagation = false,
  className,
}: {
  itemId: string;
  isFavorite: boolean;
  size?: "icon" | "icon-xs";
  /** Stop click/key events from reaching a surrounding clickable card. */
  stopPropagation?: boolean;
  className?: string;
}) {
  const { isFavorite: favorited, pending, onToggle } = useFavoriteToggle({
    initial: isFavorite,
    toggle: (next) => setItemFavorite(itemId, next),
    noun: "item",
  });

  return (
    <Button
      variant="ghost"
      size={size}
      type="button"
      aria-label={favorited ? "Unfavorite item" : "Favorite item"}
      aria-pressed={favorited}
      disabled={pending}
      className={cn(
        stopPropagation && "shrink-0 text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        void onToggle();
      }}
      onKeyDown={
        stopPropagation ? (event) => event.stopPropagation() : undefined
      }
    >
      <Star className={cn(favorited && "fill-amber-400 text-amber-400")} />
    </Button>
  );
}
