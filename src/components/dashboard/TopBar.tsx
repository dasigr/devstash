import Link from "next/link";
import { Star } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { SidebarToggle } from "@/components/dashboard/SidebarToggle";
import { SearchPalette } from "@/components/dashboard/SearchPalette";
import { CreateItemDialog } from "@/components/dashboard/CreateItemDialog";
import { CreateCollectionDialog } from "@/components/dashboard/CreateCollectionDialog";

/**
 * Dashboard top bar: sidebar toggle on the left, then a right-aligned action
 * cluster — search icon, favorites, and "New Collection" / "New Item" (each
 * opens its own create modal).
 *
 * The search icon is the command palette's trigger, so every page rendering a
 * TopBar must sit inside an <ItemDrawerProvider> (the palette opens items).
 */
export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-6">
      <SidebarToggle />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <SearchPalette />
        <Link
          href="/favorites"
          aria-label="Favorites"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Star className="size-4" />
        </Link>
        <CreateCollectionDialog />
        <CreateItemDialog />
      </div>
    </header>
  );
}
