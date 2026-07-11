import Link from "next/link";
import { FolderOpen } from "lucide-react";

import type { FavoriteCollection } from "@/lib/db/collections";
import { FavoriteRow } from "@/components/dashboard/FavoriteRow";

// Neutral accent when a favorited collection holds no items (no primary type).
const NEUTRAL_COLOR = "#6b7280";

/**
 * A favorites-list row for a collection. Navigates to the collection's detail
 * page. Its icon and badge are tinted by the collection's most-used item type.
 */
export function FavoriteCollectionRow({
  collection,
}: {
  collection: FavoriteCollection;
}) {
  const color = collection.color ?? NEUTRAL_COLOR;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="block rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={`Open ${collection.name}`}
    >
      <FavoriteRow
        icon={<FolderOpen className="size-4" style={{ color }} />}
        title={collection.name}
        badge="Collection"
        badgeColor={color}
        date={collection.updatedAt}
      />
    </Link>
  );
}
