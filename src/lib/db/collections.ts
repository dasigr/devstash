import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { itemSelect, toDashboardItem } from "@/lib/db/items";
import type { DashboardItem } from "@/lib/db/items";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/lib/validations/collections";

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
 * Fetch the given user's collections as cards, ordered and capped by the caller.
 * Each carries its item count and the item types it holds ordered most-used
 * first (so the card can tint itself by its primary type and show a badge per
 * type present).
 */
async function listCollections(
  userId: string,
  options: {
    orderBy: Prisma.CollectionOrderByWithRelationInput[];
    take?: number;
  }
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: options.orderBy,
    take: options.take,
    select: { id: true, name: true, description: true, isFavorite: true },
  });

  const typeCounts = await getTypeCountsByCollection(
    collections.map((c) => c.id)
  );

  return collections.map((collection) =>
    toDashboardCollection(collection, typeCounts.get(collection.id) ?? []),
  );
}

/** The scalar columns every `DashboardCollection` is built from. */
type CollectionRow = Pick<
  DashboardCollection,
  "id" | "name" | "description" | "isFavorite"
>;

/**
 * Build a card-shaped collection from its scalar row and its type tally. The
 * tally rows arrive most-used first, so the card tints by the primary type
 * (first entry) and shows a badge per type present.
 */
function toDashboardCollection(
  collection: CollectionRow,
  rows: TypeCountRow[],
): DashboardCollection {
  const itemTypes: CollectionTypeSummary[] = rows.map((row) => ({
    id: row.typeId,
    name: row.typeName,
    color: row.typeColor,
    icon: row.typeIcon,
  }));

  return {
    ...collection,
    itemCount: rows.reduce((sum, row) => sum + row.count, 0),
    itemTypes,
  };
}

/**
 * The given user's most recently updated collections, for the dashboard grid.
 */
export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<DashboardCollection[]> {
  return listCollections(userId, {
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
  });
}

/**
 * All of the given user's collections, for the /collections page: favorites
 * first, then most recently updated — matching the sidebar's ordering.
 */
export async function getAllCollections(
  userId: string
): Promise<DashboardCollection[]> {
  return listCollections(userId, {
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
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

/** A single collection with its items, for the collection detail page. */
export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  /** The collection's items, most recently updated first. */
  items: DashboardItem[];
}

/**
 * Fetch one of the given user's collections with its items, for
 * `/collections/[id]`.
 *
 * Owner-scoped by `findFirst({ where: { id, userId } })`: a collection id that
 * doesn't exist and one belonging to another user both return `null`, so the
 * page 404s either way and never reveals which. Items are selected through the
 * shared `itemSelect` + `toDashboardItem` so the cards render exactly as they do
 * on the dashboard. The items come back already scoped, since a collection's
 * items belong to the collection's owner.
 *
 * Wrapped in `cache()` so `generateMetadata` and the page body share one query
 * per request instead of each running it.
 */
export const getCollectionDetail = cache(
  async (id: string, userId: string): Promise<CollectionDetail | null> => {
    const collection = await prisma.collection.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        description: true,
        isFavorite: true,
        items: {
          orderBy: { item: { updatedAt: "desc" } },
          select: { item: { select: itemSelect } },
        },
      },
    });

    if (!collection) return null;

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      items: collection.items.map((link) => toDashboardItem(link.item)),
    };
  }
);

/** A collection as an option in the item forms' collection picker. */
export interface CollectionOption {
  id: string;
  name: string;
}

/**
 * The given user's collections as picker options, alphabetical. Used by the
 * new/edit item forms to choose which collections an item belongs to.
 */
export async function getCollectionOptions(
  userId: string,
): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/**
 * Create a collection owned by the given user. The owner comes from the caller's
 * session, never from the payload. A brand-new collection holds no items, so its
 * item count is 0 and it has no item types — no tally query needed.
 */
export async function createCollection(
  userId: string,
  data: CreateCollectionInput,
): Promise<DashboardCollection> {
  const created = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      user: { connect: { id: userId } },
    },
    select: { id: true, name: true, description: true, isFavorite: true },
  });

  return { ...created, itemCount: 0, itemTypes: [] };
}

/**
 * Update one of the given user's collections. Owner-scoped by `updateMany`'s
 * `where: { id, userId }` — atomic, and it can't be made to write another user's
 * row the way `collection.update` (which keys off the unique id alone) could.
 * Returns null when the id is unknown or belongs to someone else, so the caller
 * can 404 without revealing which.
 *
 * `description` is replaced, not merged: a blanked-out field clears it.
 */
export async function updateCollection(
  id: string,
  userId: string,
  data: UpdateCollectionInput,
): Promise<DashboardCollection | null> {
  const { count } = await prisma.collection.updateMany({
    where: { id, userId },
    data: { name: data.name, description: data.description ?? null },
  });
  if (count === 0) return null;

  const [updated, typeCounts] = await Promise.all([
    prisma.collection.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, description: true, isFavorite: true },
    }),
    getTypeCountsByCollection([id]),
  ]);

  return toDashboardCollection(updated, typeCounts.get(id) ?? []);
}

/**
 * Delete one of the given user's collections. A single atomic `deleteMany`
 * scoped by `{ id, userId }` (no TOCTOU window, still guards IDOR); returns
 * false when nothing matched.
 *
 * The collection's items are NOT deleted. `ItemCollection` cascades on the
 * collection side, so only the membership rows go away — every item survives and
 * simply stops belonging to this collection.
 */
export async function deleteCollection(
  id: string,
  userId: string,
): Promise<boolean> {
  const { count } = await prisma.collection.deleteMany({
    where: { id, userId },
  });
  return count > 0;
}
