"use client";

import { createContext, useContext } from "react";

interface ItemDrawerContextValue {
  /** Open the drawer and load the given item's full detail. */
  openItem: (id: string) => void;
}

export const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(
  null,
);

/** Access the item drawer — must be used under an <ItemDrawerProvider>. */
export function useItemDrawer(): ItemDrawerContextValue {
  const ctx = useContext(ItemDrawerContext);
  if (!ctx) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return ctx;
}
