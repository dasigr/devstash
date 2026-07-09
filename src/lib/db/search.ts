import { prisma } from "@/lib/prisma";
import { itemPreview } from "@/lib/db/items";

/**
 * How much of an item's content we ship to the client for matching. The whole
 * dataset is sent up front, so long snippets would dominate the payload; the
 * opening lines are what a user searches on anyway.
 */
export const SEARCH_PREVIEW_LENGTH = 160;

/** An item as the command palette sees it. */
export interface SearchItem {
  id: string;
  title: string;
  /** Truncated content / url / filename, depending on the content type. */
  preview: string;
  tags: string[];
  /** Display label of the item's type, e.g. "snippet". */
  typeName: string;
  typeColor: string;
  typeIcon: string;
}

/** A collection as the command palette sees it. */
export interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
}

/** Everything the command palette searches over, for one user. */
export interface SearchData {
  items: SearchItem[];
  collections: SearchCollection[];
}

/** Collapse whitespace and cap length, so previews stay one searchable line. */
export function truncatePreview(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > SEARCH_PREVIEW_LENGTH
    ? `${collapsed.slice(0, SEARCH_PREVIEW_LENGTH)}…`
    : collapsed;
}

/**
 * The signed-in user's full searchable dataset, fetched once and filtered on the
 * client. Both queries are scoped to `userId`, so a palette can only ever surface
 * its owner's items and collections.
 *
 * Items carry their tags as well as the fields the spec names, because the search
 * field advertises tag search in its placeholder.
 */
export async function getSearchData(userId: string): Promise<SearchData> {
  const [items, collections] = await Promise.all([
    prisma.item.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        contentType: true,
        content: true,
        url: true,
        fileName: true,
        description: true,
        tags: { select: { name: true } },
        itemType: { select: { name: true, color: true, icon: true } },
      },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      preview: truncatePreview(itemPreview(item)),
      tags: item.tags.map((tag) => tag.name),
      typeName: item.itemType.name,
      typeColor: item.itemType.color,
      typeIcon: item.itemType.icon,
    })),
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      itemCount: collection._count.items,
    })),
  };
}
