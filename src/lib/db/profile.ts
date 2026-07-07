import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** The signed-in user's profile fields, plus derived flags the UI needs. */
export interface ProfileUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isPro: boolean;
  createdAt: Date;
  /** True for email/password accounts; false for OAuth-only (no password hash). */
  hasPassword: boolean;
}

/**
 * Resolve the signed-in user from the session and load the profile fields.
 * Returns null when there's no session — callers on the protected route treat
 * that as "guest" and redirect. `password` is only read to derive `hasPassword`
 * (so the change-password action can be gated); the hash itself is never exposed.
 */
export async function getProfile(): Promise<ProfileUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isPro: true,
      createdAt: true,
      password: true,
    },
  });
  if (!user) return null;

  const { password, ...rest } = user;
  return { ...rest, hasPassword: password !== null };
}

/** Per-item-type tally for the profile usage breakdown. */
export interface ProfileTypeStat {
  id: string;
  /** Display label, e.g. "Snippets". */
  name: string;
  color: string;
  icon: string;
  count: number;
}

export interface ProfileStats {
  totalItems: number;
  totalCollections: number;
  /** All seven system types, ordered per the overview, with per-user counts. */
  byType: ProfileTypeStat[];
}

// Display order for the item-type breakdown, matching the item-types table.
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
 * Usage stats for the given user: total items, total collections, and a
 * per-type breakdown across all seven system types (0 when the user has none of
 * a type). The breakdown uses one grouped count over the user's items rather
 * than a query per type.
 */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [totalItems, totalCollections, types, grouped] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: { id: true, name: true, color: true, icon: true },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const counts = new Map(grouped.map((g) => [g.itemTypeId, g._count._all]));

  const byType = types
    .sort((a, b) => TYPE_ORDER.indexOf(a.name) - TYPE_ORDER.indexOf(b.name))
    .map((type) => ({
      id: type.id,
      // Names are stored singular/lowercase (e.g. "snippet"); pluralize + cap.
      name: `${type.name[0].toUpperCase()}${type.name.slice(1)}s`,
      color: type.color,
      icon: type.icon,
      count: counts.get(type.id) ?? 0,
    }));

  return { totalItems, totalCollections, byType };
}
