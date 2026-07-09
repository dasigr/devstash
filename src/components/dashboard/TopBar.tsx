import { SidebarToggle } from "@/components/dashboard/SidebarToggle";
import { SearchPalette } from "@/components/dashboard/SearchPalette";
import { CreateItemDialog } from "@/components/dashboard/CreateItemDialog";
import { CreateCollectionDialog } from "@/components/dashboard/CreateCollectionDialog";

/**
 * Dashboard top bar: sidebar toggle, search field, and
 * "New Collection" / "New Item" actions — each opens its own create modal.
 *
 * The search field is the command palette's trigger, so every page rendering a
 * TopBar must sit inside an <ItemDrawerProvider> (the palette opens items).
 */
export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-6">
      <SidebarToggle />

      <div className="w-full max-w-md">
        <SearchPalette />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <CreateCollectionDialog />
        <CreateItemDialog />
      </div>
    </header>
  );
}
