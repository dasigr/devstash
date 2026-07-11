import Link from "next/link";
import { Star } from "lucide-react";

import type { DashboardCollection } from "@/lib/db/collections";
import { ItemTypeBadge } from "@/components/dashboard/ItemTypeBadge";
import { CollectionCardMenu } from "@/components/dashboard/CollectionCardMenu";

/**
 * A collection card. Its background is tinted with the color of the item type
 * the collection holds most (the first entry in `itemTypes`), and it shows a
 * badge for each item type present.
 *
 * The card is a container rather than one big <Link>, because a dropdown trigger
 * can't be nested inside an anchor. Instead the link overlays the whole card as
 * the click surface, and the actions menu sits above it — so a click anywhere
 * else navigates to the collection, while the menu button opens the menu.
 */
export function CollectionCard({
  collection,
}: {
  collection: DashboardCollection;
}) {
  const types = collection.itemTypes;
  const primaryColor = types[0]?.color;

  return (
    <div
      className="group relative flex min-h-40 flex-col rounded-xl border border-border bg-card p-4 transition-colors focus-within:border-muted-foreground/30 hover:border-muted-foreground/30"
      // Tint reflects the collection's primary item type.
      style={
        primaryColor
          ? {
              backgroundImage: `linear-gradient(135deg, ${primaryColor}24, ${primaryColor}0a)`,
              borderColor: `${primaryColor}33`,
            }
          : undefined
      }
    >
      <Link
        href={`/collections/${collection.id}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={`Open ${collection.name}`}
      />

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{collection.name}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {collection.isFavorite && (
            <Star className="mt-0.5 size-4 shrink-0 fill-amber-400 text-amber-400" />
          )}
          <CollectionCardMenu
            collection={{
              id: collection.id,
              name: collection.name,
              description: collection.description,
            }}
            isFavorite={collection.isFavorite}
          />
        </div>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {collection.description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <div className="flex items-center gap-1.5">
          {types.map((type) => (
            <ItemTypeBadge key={type.id} type={type} size="sm" />
          ))}
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {collection.itemCount} items
        </span>
      </div>
    </div>
  );
}
