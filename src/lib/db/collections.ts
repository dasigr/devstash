import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { itemSelect, relativeTime, toDashboardItem } from "@/lib/db/items";
import type { DashboardItem } from "@/lib/db/items";
import {
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  ITEMS_PER_PAGE,
  buildPageInfo,
} from "@/lib/pagination";
import type { PageInfo } from "@/lib/pagination";
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
    skip?: number;
    take?: number;
  }
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: options.orderBy,
    skip: options.skip,
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
  limit = DASHBOARD_COLLECTIONS_LIMIT
): Promise<DashboardCollection[]> {
  return listCollections(userId, {
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
  });
}

/** One page of collections plus the totals its controls need. */
export interface CollectionPage {
  collections: DashboardCollection[];
  pagination: PageInfo;
}

/**
 * One page of the given user's collections, for the /collections page:
 * favorites first, then most recently updated — matching the sidebar's
 * ordering.
 *
 * Only the requested page is fetched. The count runs first because
 * `buildPageInfo` clamps an out-of-range `?page=` to the last page, and the
 * clamped page is what decides `skip`.
 */
export async function getAllCollections(
  userId: string,
  requestedPage = 1
): Promise<CollectionPage> {
  const totalCount = await prisma.collection.count({ where: { userId } });
  const pagination = buildPageInfo(
    requestedPage,
    COLLECTIONS_PER_PAGE,
    totalCount
  );

  const collections = await listCollections(userId, {
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    skip: pagination.skip,
    take: pagination.take,
  });

  return { collections, pagination };
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

/** A favorited collection prepared for the compact /favorites list. */
export interface FavoriteCollection {
  id: string;
  name: string;
  /** Human-friendly relative time, derived from updatedAt. */
  updatedAt: string;
  /** Color of the most-used item type; null when the collection is empty. */
  color: string | null;
  itemCount: number;
}

/**
 * The given user's favorited collections for the /favorites list, most recently
 * updated first. Each carries its item count and the color of its most-used item
 * type (null when empty) so the row can tint its icon and badge.
 */
export async function getFavoriteCollections(
  userId: string,
): Promise<FavoriteCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  const typeCounts = await getTypeCountsByCollection(
    collections.map((c) => c.id),
  );

  return collections.map((collection) => {
    const rows = typeCounts.get(collection.id) ?? [];
    return {
      id: collection.id,
      name: collection.name,
      updatedAt: relativeTime(collection.updatedAt),
      // Grouped rows come most-used first, so the first row is the primary type.
      color: rows[0]?.typeColor ?? null,
      itemCount: rows.reduce((sum, row) => sum + row.count, 0),
    };
  });
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

/** A collection's own fields, without its items. */
export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}

/**
 * Fetch one of the given user's collections, without its items.
 *
 * Owner-scoped by `findFirst({ where: { id, userId } })`: a collection id that
 * doesn't exist and one belonging to another user both return `null`, so the
 * page 404s either way and never reveals which.
 *
 * Wrapped in `cache()` so `generateMetadata` (which only needs the name) and
 * `getCollectionDetail` share one query per request instead of each running it.
 */
export const getCollectionSummary = cache(
  async (id: string, userId: string): Promise<CollectionSummary | null> => {
    return prisma.collection.findFirst({
      where: { id, userId },
      select: { id: true, name: true, description: true, isFavorite: true },
    });
  }
);

/** A single collection with one page of its items, for the detail page. */
export interface CollectionDetail extends CollectionSummary {
  /** Just the requested page of items, most recently updated first. */
  items: DashboardItem[];
  pagination: PageInfo;
}

/**
 * Fetch one of the given user's collections with one page of its items, for
 * `/collections/[id]`. Returns null when the collection is unknown or belongs
 * to someone else (see `getCollectionSummary`).
 *
 * The items are a separate `skip`/`take` query rather than a nested select, so
 * a large collection never loads every item to show twenty. The count runs
 * first because `buildPageInfo` clamps an out-of-range `?page=` to the last
 * page, and the clamped page is what decides `skip`.
 *
 * The item query needs no owner filter of its own: the collection above is
 * already owner-verified, and a collection's items belong to its owner. Items
 * are selected through the shared `itemSelect` + `toDashboardItem` so the cards
 * render exactly as they do on the dashboard.
 */
export async function getCollectionDetail(
  id: string,
  userId: string,
  requestedPage = 1,
): Promise<CollectionDetail | null> {
  const collection = await getCollectionSummary(id, userId);
  if (!collection) return null;

  const totalCount = await prisma.itemCollection.count({
    where: { collectionId: id },
  });
  const pagination = buildPageInfo(requestedPage, ITEMS_PER_PAGE, totalCount);

  const links = await prisma.itemCollection.findMany({
    where: { collectionId: id },
    orderBy: { item: { updatedAt: "desc" } },
    skip: pagination.skip,
    take: pagination.take,
    select: { item: { select: itemSelect } },
  });

  return {
    ...collection,
    items: links.map((link) => toDashboardItem(link.item)),
    pagination,
  };
}

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
