"use client";

import { Star } from "lucide-react";

import { setCollectionFavorite } from "@/actions/collections";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/components/dashboard/useFavoriteToggle";

/**
 * A star button that toggles a collection's favorite state, for the collection
 * detail page's action row. Shows the current state (filled amber when
 * favorited) and doubles as the at-a-glance indicator.
 */
export function CollectionFavoriteButton({
  collectionId,
  isFavorite,
}: {
  collectionId: string;
  isFavorite: boolean;
}) {
  const { isFavorite: favorited, pending, onToggle } = useFavoriteToggle({
    initial: isFavorite,
    toggle: (next) => setCollectionFavorite(collectionId, next),
    noun: "collection",
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      aria-label={favorited ? "Unfavorite collection" : "Favorite collection"}
      aria-pressed={favorited}
      disabled={pending}
      className="text-muted-foreground hover:text-foreground"
      onClick={() => void onToggle()}
    >
      <Star className={cn(favorited && "fill-amber-400 text-amber-400")} />
    </Button>
  );
}
