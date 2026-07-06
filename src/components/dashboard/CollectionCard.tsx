import Link from "next/link";
import { Star } from "lucide-react";

import type { DashboardCollection } from "@/lib/db/collections";
import { ItemTypeBadge } from "@/components/dashboard/ItemTypeBadge";

/**
 * A collection card. Its background is tinted with the color of the item type
 * the collection holds most (the first entry in `itemTypes`), and it shows a
 * badge for each item type present.
 */
export function CollectionCard({
  collection,
}: {
  collection: DashboardCollection;
}) {
  const types = collection.itemTypes;
  const primaryColor = types[0]?.color;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group flex min-h-40 flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30"
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
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{collection.name}</h3>
        {collection.isFavorite && (
          <Star className="mt-0.5 size-4 shrink-0 fill-amber-400 text-amber-400" />
        )}
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
    </Link>
  );
}