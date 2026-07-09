"use client";

import {
  Download,
  File as FileIcon,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";
import { fileIconCategory, type FileIconCategory } from "@/lib/file-icons";
import { formatBytes } from "@/lib/validations/upload";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Which lucide icon renders for each file category.
const ICON_BY_CATEGORY: Record<FileIconCategory, LucideIcon> = {
  pdf: FileText,
  image: FileImage,
  code: FileCode,
  spreadsheet: FileSpreadsheet,
  text: FileText,
  generic: FileIcon,
};

/**
 * A single row in the file-list view (Drive/Dropbox style). The whole row opens
 * the item drawer; the download control is an anchor to the owner-scoped
 * download proxy and stops propagation so it doesn't also open the drawer.
 *
 * Rendered as a role="button" div (rather than a real <button>) so the nested
 * download <a> stays valid; keyboard activation is wired via onKeyDown.
 */
export function FileListRow({ item }: { item: DashboardItem }) {
  const { openItem } = useItemDrawer();

  const displayName = item.fileName ?? item.title;
  const Icon = ICON_BY_CATEGORY[fileIconCategory(displayName)];
  const size = item.fileSize != null ? formatBytes(item.fileSize) : "";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title}`}
      onClick={() => openItem(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openItem(item.id);
        }
      }}
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:gap-4"
    >
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />

      {/* Info: stacked on mobile, single row from sm up. */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
        <span className="truncate text-sm font-medium text-foreground sm:flex-1">
          {displayName}
        </span>
        <span className="text-xs text-muted-foreground sm:w-20 sm:shrink-0 sm:text-right">
          {size}
        </span>
        <span className="text-xs text-muted-foreground sm:w-24 sm:shrink-0 sm:text-right">
          {item.updatedAt}
        </span>
      </div>

      <a
        href={`/api/items/${item.id}/download`}
        onClick={(event) => event.stopPropagation()}
        aria-label={`Download ${displayName}`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "shrink-0 text-muted-foreground",
        )}
      >
        <Download />
      </a>
    </div>
  );
}
