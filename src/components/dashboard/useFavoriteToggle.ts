"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/actions/items";
import { toastManager } from "@/lib/toast";

/**
 * Optimistic favorite toggle shared by the item and collection favorite
 * controls. Flips the local state immediately, calls the owner-scoped server
 * action, and on success refreshes the server-rendered surfaces (cards, stats,
 * sidebar, /favorites) via `router.refresh()`. On failure it reverts the local
 * state and toasts — so a rejected write never leaves the star out of sync.
 */
export function useFavoriteToggle({
  initial,
  toggle,
  noun,
}: {
  initial: boolean;
  toggle: (next: boolean) => Promise<ActionResult<unknown>>;
  /** Entity name for the failure toast, e.g. "item" or "collection". */
  noun: string;
}) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initial);
  const [pending, setPending] = useState(false);

  async function onToggle() {
    if (pending) return;
    const next = !isFavorite;

    setIsFavorite(next); // optimistic
    setPending(true);
    try {
      const result = await toggle(next);
      if (!result.success) {
        setIsFavorite(!next); // revert
        toastManager.add({
          title: `Couldn't ${next ? "favorite" : "unfavorite"} ${noun}`,
          description: result.error,
          timeout: 6000,
        });
        return;
      }
      router.refresh();
    } catch {
      setIsFavorite(!next); // revert
      toastManager.add({
        title: "Something went wrong",
        description: "Please try again.",
        timeout: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  return { isFavorite, pending, onToggle };
}
