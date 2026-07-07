import { cache } from "react";

import { prisma } from "@/lib/prisma";
import type { ContentType } from "@/generated/prisma/client";

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
