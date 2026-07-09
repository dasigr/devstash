import { ImageIcon } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";

/**
 * A thumbnail card for the image gallery. Shows the image at a 16:9 ratio,
 * cropped to fill (object-cover), with a subtle zoom on hover. Falls back to a
 * placeholder when the item has no file URL.
 */
export function ImageCard({ item }: { item: DashboardItem }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-muted-foreground/30">
      <div className="aspect-video overflow-hidden bg-muted/50">
        {item.fileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.fileUrl}
            alt={item.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8" />
          </div>
        )}
      </div>
      <p className="truncate px-3 py-2 text-sm font-medium text-foreground">
        {item.title}
      </p>
    </div>
  );
}
