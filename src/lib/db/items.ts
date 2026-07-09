import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { deleteFromR2, r2KeyFromUrl } from "@/lib/r2";
import type { ContentType, Prisma } from "@/generated/prisma/client";
import type {
  CreateItemInput,
  UpdateItemInput,
} from "@/lib/validations/items";

/** Minimal item-type shape an item card needs (badge icon + accent color). */
export interface ItemTypeSummary {
  id: string;
  name: string;
  color: string;
  icon: string;
}

/** An item prepared for the dashboard Pinned / Recent grids. */
export interface DashboardItem {
  id: string;
  title: string;
  /** Text content, url, or file name depending on the item's content type. */
  preview: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  /** Human-friendly relative time (e.g. "2h ago"), derived from updatedAt. */
  updatedAt: string;
  itemType: ItemTypeSummary;
}

/** Shape of the fields we select for each item, shared across the queries. */
const itemSelect = {
  id: true,
  title: true,
  contentType: true,
  content: true,
  url: true,
  fileName: true,
  description: true,
  isPinned: true,
  isFavorite: true,
  updatedAt: true,
  itemType: { select: { id: true, name: true, color: true, icon: true } },
  tags: { select: { name: true } },
} as const;

type RawItem = {
  id: string;
  title: string;
  contentType: ContentType;
  content: string | null;
  url: string | null;
  fileName: string | null;
  description: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: Date;
  itemType: ItemTypeSummary;
  tags: { name: string }[];
};

/** Pick the preview text for a card based on the item's content type. */
function itemPreview(item: RawItem): string {
  switch (item.contentType) {
    case "URL":
      return item.url ?? item.description ?? "";
    case "FILE":
      return item.fileName ?? item.description ?? "";
    default:
      return item.content ?? item.description ?? "";
  }
}

/** Format a timestamp as a short relative time, matching the card style. */
function relativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

/** Map a raw Prisma item into the display shape the cards consume. */
function toDashboardItem(item: RawItem): DashboardItem {
  return {
    id: item.id,
    title: item.title,
    preview: itemPreview(item),
    tags: item.tags.map((tag) => tag.name),
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    updatedAt: relativeTime(item.updatedAt),
    itemType: item.itemType,
  };
}

/** Pinned items, most recently updated first (empty when none are pinned). */
export async function getPinnedItems(): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { isPinned: true },
    orderBy: { updatedAt: "desc" },
    select: itemSelect,
  });
  return items.map(toDashboardItem);
}

/** The most recently updated items for the Recent Items grid. */
export async function getRecentItems(limit = 10): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: itemSelect,
  });
  return items.map(toDashboardItem);
}

/** Totals for the dashboard stats tiles. */
export async function getItemStats(): Promise<{
  total: number;
  favorites: number;
}> {
  const [total, favorites] = await Promise.all([
    prisma.item.count(),
    prisma.item.count({ where: { isFavorite: true } }),
  ]);
  return { total, favorites };
}

/** A collection an item belongs to, for the drawer's "In collections" list. */
export interface ItemDetailCollection {
  id: string;
  name: string;
  /** Accent color (the collection's default type color, gray when unset). */
  color: string;
}

/** Full detail for a single item, shown in the item drawer. */
export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  /** Raw text content (text types); null for file/url. */
  content: string | null;
  /** Optional code language (e.g. "TypeScript"). */
  language: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
  collections: ItemDetailCollection[];
  isFavorite: boolean;
  isPinned: boolean;
  itemType: ItemTypeSummary;
  /** Formatted creation date, e.g. "Jun 28, 2026". */
  createdAt: string;
  /** Human-friendly relative time, e.g. "2h ago". */
  updatedAt: string;
}

// Fallback accent when a collection has no default type set.
const COLLECTION_FALLBACK_COLOR = "#6b7280";

/**
 * Full detail for one item, scoped to its owner so a user can only open their
 * own items (guards against IDOR from the /api/items/[id] route). Returns null
 * when the item doesn't exist or belongs to someone else.
 */
export async function getItemDetail(
  id: string,
  userId: string,
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      description: true,
      contentType: true,
      content: true,
      language: true,
      url: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      itemType: { select: { id: true, name: true, color: true, icon: true } },
      tags: { select: { name: true } },
      collections: {
        select: {
          collection: {
            select: {
              id: true,
              name: true,
              defaultType: { select: { color: true } },
            },
          },
        },
      },
    },
  });
  if (!item) return null;

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.contentType,
    content: item.content,
    language: item.language,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    tags: item.tags.map((tag) => tag.name),
    collections: item.collections.map(({ collection }) => ({
      id: collection.id,
      name: collection.name,
      color: collection.defaultType?.color ?? COLLECTION_FALLBACK_COLOR,
    })),
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    itemType: item.itemType,
    createdAt: item.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    updatedAt: relativeTime(item.updatedAt),
  };
}

// Storage shape per creatable type: link -> URL, file/image -> FILE (R2), and
// every text type -> TEXT.
const CONTENT_TYPE_BY_TYPE: Record<CreateItemInput["type"], ContentType> = {
  snippet: "TEXT",
  prompt: "TEXT",
  command: "TEXT",
  note: "TEXT",
  link: "URL",
  file: "FILE",
  image: "FILE",
};

/**
 * Create a new item owned by the given user and return its ItemDetail. Resolves
 * the chosen creatable type to its system ItemType, derives the storage
 * contentType from it, and connects tags (creating any that don't exist).
 * Returns null when the system type can't be found (shouldn't happen once the
 * types are seeded), so the caller can surface a generic error.
 */
export async function createItem(
  userId: string,
  data: CreateItemInput,
): Promise<ItemDetail | null> {
  const type = await prisma.itemType.findFirst({
    where: { isSystem: true, name: data.type },
    select: { id: true },
  });
  if (!type) return null;

  const created = await prisma.item.create({
    data: {
      title: data.title,
      contentType: CONTENT_TYPE_BY_TYPE[data.type],
      description: data.description ?? null,
      content: data.content ?? null,
      language: data.language ?? null,
      url: data.url ?? null,
      fileUrl: data.fileUrl ?? null,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
      user: { connect: { id: userId } },
      itemType: { connect: { id: type.id } },
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    select: { id: true },
  });

  return getItemDetail(created.id, userId);
}

/**
 * Update one item's editable fields, scoped to its owner (guards against IDOR),
 * and return its refreshed ItemDetail so the drawer needn't re-fetch. Returns
 * null when the item doesn't exist or belongs to someone else.
 *
 * Only fields present on `data` are written — an undefined field is left as-is;
 * a null field is cleared. Tags are fully replaced: existing links are dropped
 * (`set: []`) and the given names are connected, creating any that don't exist.
 */
export async function updateItem(
  id: string,
  userId: string,
  data: UpdateItemInput,
): Promise<ItemDetail | null> {
  // Ownership check — item.update keys off the unique id alone, so we can't
  // scope the write by userId directly.
  const owned = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!owned) return null;

  const updateData: Prisma.ItemUpdateInput = {
    title: data.title,
    tags: {
      set: [],
      connectOrCreate: data.tags.map((name) => ({
        where: { name },
        create: { name },
      })),
    },
  };
  if (data.description !== undefined) updateData.description = data.description;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.url !== undefined) updateData.url = data.url;

  await prisma.item.update({ where: { id }, data: updateData });

  return getItemDetail(id, userId);
}

/**
 * Delete one item, scoped to its owner so a user can only delete their own
 * (guards against IDOR). We first read the item's fileUrl (owner-scoped), then
 * delete via `deleteMany` filtered by id + userId, then best-effort remove the
 * backing R2 object so file/image uploads don't leak. Returns true when a row
 * was deleted, false otherwise. Cascade deletes remove the item's
 * ItemCollection links and tag join rows per the schema.
 */
export async function deleteItem(
  id: string,
  userId: string,
): Promise<boolean> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    select: { fileUrl: true },
  });
  if (!item) return false;

  const { count } = await prisma.item.deleteMany({ where: { id, userId } });
  if (count === 0) return false;

  // Best-effort R2 cleanup — never let a storage error fail the item delete.
  if (item.fileUrl) {
    const key = r2KeyFromUrl(item.fileUrl);
    if (key) {
      try {
        await deleteFromR2(key);
      } catch (error) {
        console.error("Failed to delete R2 object for item:", id, error);
      }
    }
  }

  return true;
}

/** A file-backed item's stored file, for the owner-scoped download proxy. */
export interface ItemFile {
  fileUrl: string;
  fileName: string;
}

/**
 * The stored file for a file/image item, scoped to its owner so a user can only
 * download their own (guards against IDOR). Returns null when the item doesn't
 * exist, belongs to someone else, or has no file attached.
 */
export async function getItemFile(
  id: string,
  userId: string,
): Promise<ItemFile | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    select: { fileUrl: true, fileName: true },
  });
  if (!item?.fileUrl) return null;
  return { fileUrl: item.fileUrl, fileName: item.fileName ?? "download" };
}

/** A system item type prepared for the sidebar nav. */
export interface SidebarItemType {
  id: string;
  /** Display label, e.g. "Snippets". */
  name: string;
  /** Route slug under /items, e.g. "snippets". */
  slug: string;
  color: string;
  icon: string;
  /** Pro-gated type (file / image), per the documented data model. */
  isPro: boolean;
  /** Number of items of this type. */
  count: number;
}

// The data model designates file & image as the Pro-only types; ItemType has no
// isPro column, so we derive it from the system type name.
const PRO_TYPE_NAMES = new Set(["file", "image"]);

/** Display label for a system type, e.g. "snippet" -> "Snippets". */
function typeLabel(name: string): string {
  return `${name[0].toUpperCase()}${name.slice(1)}s`;
}

/** Route slug under /items for a system type, e.g. "snippet" -> "snippets". */
function typeSlug(name: string): string {
  return `${name}s`;
}

// Display order for the sidebar, matching the item-types table in the overview.
const TYPE_ORDER = [
  "snippet",
  "prompt",
  "note",
  "command",
  "link",
  "file",
  "image",
];

/**
 * The system item types for the sidebar, each with a live item count, ordered
 * to match the documented item-types table. Names are stored singular/lowercase
 * (e.g. "snippet"); we pluralize for the label and the /items/<slug> route.
 */
export async function getSidebarItemTypes(): Promise<SidebarItemType[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      _count: { select: { items: true } },
    },
  });

  return types
    .sort((a, b) => TYPE_ORDER.indexOf(a.name) - TYPE_ORDER.indexOf(b.name))
    .map((type) => ({
      id: type.id,
      name: typeLabel(type.name),
      slug: typeSlug(type.name),
      color: type.color,
      icon: type.icon,
      isPro: PRO_TYPE_NAMES.has(type.name),
      count: type._count.items,
    }));
}

/** A resolved item type plus its items, for the /items/[type] listing page. */
export interface ItemTypeListing {
  type: {
    id: string;
    /** Display label, e.g. "Snippets". */
    name: string;
    /** Route slug, e.g. "snippets". */
    slug: string;
    color: string;
    icon: string;
    isPro: boolean;
  };
  items: DashboardItem[];
}

/**
 * Resolve a plural /items slug (e.g. "snippets") to its system item type and
 * that type's items, most recently updated first. Returns null when the slug
 * doesn't match a system type, so the page can render a 404.
 *
 * Wrapped in React `cache()` so a single request (generateMetadata + the page)
 * shares one lookup instead of querying twice.
 */
export const getItemsByType = cache(
  async (slug: string): Promise<ItemTypeListing | null> => {
    // Slugs are the plural of the singular stored name (snippet -> snippets).
    const singular = slug.endsWith("s") ? slug.slice(0, -1) : slug;

    const type = await prisma.itemType.findFirst({
      where: { isSystem: true, name: singular },
      select: { id: true, name: true, color: true, icon: true },
    });
    if (!type) return null;

    const items = await prisma.item.findMany({
      where: { itemTypeId: type.id },
      orderBy: { updatedAt: "desc" },
      select: itemSelect,
    });

    return {
      type: {
        id: type.id,
        name: typeLabel(type.name),
        slug: typeSlug(type.name),
        color: type.color,
        icon: type.icon,
        isPro: PRO_TYPE_NAMES.has(type.name),
      },
      items: items.map(toDashboardItem),
    };
  }
);
