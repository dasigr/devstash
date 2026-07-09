import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isPro: boolean;
}

/**
 * Resolve the signed-in user from the session, then load the fields the UI
 * needs (including `isPro`, which isn't carried on the JWT). Returns null when
 * there's no session — callers on protected routes can treat that as "guest".
 *
 * Wrapped in `cache()` so a page that resolves the user in both
 * `generateMetadata` and its body only hits the session + DB once per request.
 */
export const getCurrentUser = cache(
  async (): Promise<CurrentUser | null> => {
    const session = await auth();
    if (!session?.user?.id) return null;

    return prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, isPro: true },
    });
  }
);
