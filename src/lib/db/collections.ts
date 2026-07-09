import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

/** Minimal item-type shape a collection card needs to render a badge. */
export interface CollectionTypeSummary {
  id: string;
  name: string;
  color: string;
  icon: string;
}

/** One (collection, item type) tally row from the grouped aggregate query. */
interface TypeCountRow {
  collectionId: string;
  typeId: string;
  typeName: string;
  typeColor: string;
  typeIcon: string;
  count: number;
}

/**
 * Count items per (collection, item type) in a single grouped query, so we don't
 * load one row per item just to tally types. Returns the tally rows for the given
 * collections, most-used type first within each collection.
 *
 * `itemTypeId` lives on `Item` (not the join table), so this joins
 * `ItemCollection -> Item -> ItemType`; Prisma `groupBy` can't span that join,
 * hence the raw grouped query.
 *
 * No owner filter here: callers only ever pass collection ids they've already
 * scoped to the owner.
 */
async function getTypeCountsByCollection(
  collectionIds: string[]
): Promise<Map<string, TypeCountRow[]>> {
  const byCollection = new Map<string, TypeCountRow[]>();
  if (collectionIds.length === 0) return byCollection;

  const rows = await prisma.$queryRaw<TypeCountRow[]>`
    SELECT ic."collectionId" AS "collectionId",
           t."id"            AS "typeId",
           t."name"          AS "typeName",
           t."color"         AS "typeColor",
           t."icon"          AS "typeIcon",
           COUNT(*)::int     AS "count"
    FROM "ItemCollection" ic
    JOIN "Item" i     ON i."id" = ic."itemId"
    JOIN "ItemType" t ON t."id" = i."itemTypeId"
    WHERE ic."collectionId" IN (${Prisma.join(collectionIds)})
    GROUP BY ic."collectionId", t."id", t."name", t."color", t."icon"
    ORDER BY "count" DESC, t."name" ASC
  `;

  // Rows arrive most-used first (ORDER BY count DESC), so appending preserves
  // that order per collection.
  for (const row of rows) {
    const list = byCollection.get(row.collectionId);
    if (list) {
      list.push(row);
    } else {
      byCollection.set(row.collectionId, [row]);
    }
  }
  return byCollection;
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
 * Fetch the given user's most recently updated collections for the dashboard
 * grid, each with its item count and the item types it holds ordered most-used
 * first (so the card can tint itself by its primary type and show a badge per
 * type present).
 */
export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, name: true, description: true, isFavorite: true },
  });

  const typeCounts = await getTypeCountsByCollection(
    collections.map((c) => c.id)
  );

  return collections.map((collection) => {
    // Grouped rows come most-used first; the card tints by the primary type
    // (first entry) and shows a badge per type present.
    const rows = typeCounts.get(collection.id) ?? [];
    const itemTypes: CollectionTypeSummary[] = rows.map((row) => ({
      id: row.typeId,
      name: row.typeName,
      color: row.typeColor,
      icon: row.typeIcon,
    }));

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: rows.reduce((sum, row) => sum + row.count, 0),
      itemTypes,
    };
  });
}

/** Totals for the dashboard stats tiles, scoped to the given user. */
export async function getCollectionStats(userId: string): Promise<{
  total: number;
  favorites: number;
}> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);
  return { total, favorites };
}

/** A collection prepared for the sidebar list. */
export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  /** Color of the most-used item type — drives the recents circle. */
  color: string | null;
}

/**
 * The given user's collections for the sidebar list: favorites first, then most
 * recently updated, capped. Each carries the color of its most-used item type so
 * a non-favorite can render a colored circle.
 */
export async function getSidebarCollections(
  userId: string,
  limit = 6
): Promise<SidebarCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: { id: true, name: true, isFavorite: true },
  });

  const typeCounts = await getTypeCountsByCollection(
    collections.map((c) => c.id)
  );

  return collections.map((collection) => {
    // Grouped rows come most-used first, so the first row is the primary type;
    // the circle reflects its color (null when the collection is empty).
    const primary = typeCounts.get(collection.id)?.[0];

    return {
      id: collection.id,
      name: collection.name,
      isFavorite: collection.isFavorite,
      color: primary?.typeColor ?? null,
    };
  });
}
