import { prisma } from "@/lib/prisma";

// Free-tier usage limits and the decision helpers that gate item/collection
// creation. Constants + logic are pure; the only impure part is the
// prisma.*.count call (mockable), mirroring getItemStats / getCollectionStats.
// See context/project-overview.md §7 Monetization for the caps.

/** Max items a free-tier user may create. */
export const FREE_ITEM_LIMIT = 50;

/** Max collections a free-tier user may create. */
export const FREE_COLLECTION_LIMIT = 3;

/** System item types available only to Pro users (consumed in Phase 2). */
export const PRO_ITEM_TYPES = new Set(["file", "image"]);

/** Result of a usage-limit check. `limit` is Infinity for Pro (unlimited). */
export interface QuotaCheck {
  allowed: boolean;
  used: number;
  limit: number;
}

/** Whether the user can create another item under their plan's limits. */
export async function canCreateItem(
  userId: string,
  isPro: boolean,
): Promise<QuotaCheck> {
  if (isPro) return { allowed: true, used: 0, limit: Infinity };
  const used = await prisma.item.count({ where: { userId } });
  return { allowed: used < FREE_ITEM_LIMIT, used, limit: FREE_ITEM_LIMIT };
}

/** Whether the user can create another collection under their plan's limits. */
export async function canCreateCollection(
  userId: string,
  isPro: boolean,
): Promise<QuotaCheck> {
  if (isPro) return { allowed: true, used: 0, limit: Infinity };
  const used = await prisma.collection.count({ where: { userId } });
  return {
    allowed: used < FREE_COLLECTION_LIMIT,
    used,
    limit: FREE_COLLECTION_LIMIT,
  };
}
