import { prisma } from "@/lib/prisma";

/** Minimal item-type shape a collection card needs to render a badge. */
export interface CollectionTypeSummary {
  id: string;
  name: string;
  color: string;
  icon: string;
}

/** A collection prepared for the dashboard grid. */
export interface DashboardCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  /** Item types the collection holds, most-used first. */
  itemTypes: CollectionTypeSummary[];
}

/**
 * Fetch the most recently updated collections for the dashboard grid, each with
 * its item count and the item types it holds ordered most-used first (so the
 * card can tint itself by its primary type and show a badge per type present).
 */
export async function getRecentCollections(
  limit = 6
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      items: {
        include: {
          item: {
            select: {
              itemType: {
                select: { id: true, name: true, color: true, icon: true },
              },
            },
          },
        },
      },
    },
  });

  return collections.map((collection) => {
    // Tally items per type so badges show most-used first and the card is
    // tinted by its primary (most common) type.
    const counts = new Map<
      string,
      { type: CollectionTypeSummary; count: number }
    >();
    for (const { item } of collection.items) {
      const type = item.itemType;
      const entry = counts.get(type.id);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(type.id, { type, count: 1 });
      }
    }

    const itemTypes = [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .map((entry) => entry.type);

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: collection.items.length,
      itemTypes,
    };
  });
}

/** Totals for the dashboard stats tiles. */
export async function getCollectionStats(): Promise<{
  total: number;
  favorites: number;
}> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count(),
    prisma.collection.count({ where: { isFavorite: true } }),
  ]);
  return { total, favorites };
}
