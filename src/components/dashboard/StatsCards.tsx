import { FolderHeart, LayoutGrid, Library, Star } from "lucide-react";

interface StatsCardsProps {
  /** Total number of items. */
  itemsCount: number;
  /** Number of favorited items. */
  favoriteItemsCount: number;
  /** Total number of collections. */
  collectionsCount: number;
  /** Number of favorited collections. */
  favoriteCollectionsCount: number;
}

/** Four summary tiles at the top of the dashboard. */
export function StatsCards({
  itemsCount,
  favoriteItemsCount,
  collectionsCount,
  favoriteCollectionsCount,
}: StatsCardsProps) {
  const stats = [
    { label: "Items", value: itemsCount, icon: LayoutGrid },
    { label: "Collections", value: collectionsCount, icon: Library },
    { label: "Favorite Items", value: favoriteItemsCount, icon: Star },
    {
      label: "Favorite Collections",
      value: favoriteCollectionsCount,
      icon: FolderHeart,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-semibold tabular-nums leading-none text-foreground">
              {value}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}