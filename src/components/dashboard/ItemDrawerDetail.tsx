"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Clock,
  Copy,
  Pencil,
  Pin,
  Star,
  X,
} from "lucide-react";

import type { ItemDetail } from "@/lib/db/items";
import { cn } from "@/lib/utils";
import { isCodeType, isMarkdownType } from "@/lib/code-types";
import { Button } from "@/components/ui/button";
import { SheetClose, SheetTitle } from "@/components/ui/sheet";
import { ItemTypeBadge } from "@/components/dashboard/ItemTypeBadge";
import { DeleteItemButton } from "@/components/dashboard/DeleteItemButton";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";

/** Capitalized singular type name for the header, e.g. "snippet" -> "Snippet". */
function typeHeading(name: string): string {
  return name ? `${name[0].toUpperCase()}${name.slice(1)}` : name;
}

/** The text a Copy action should place on the clipboard for this item. */
function copyValue(item: ItemDetail): string {
  switch (item.contentType) {
    case "URL":
      return item.url ?? "";
    case "FILE":
      return item.fileName ?? "";
    default:
      return item.content ?? "";
  }
}

/** Label for the content box header — the code language, else the type name. */
function contentLabel(item: ItemDetail): string {
  return item.language ?? typeHeading(item.itemType.name);
}

/**
 * The item drawer's detail view. Edit switches the drawer into edit mode via
 * `onEdit`; Delete confirms then removes the item and closes the drawer via
 * `onDeleted`. Pin and Favorite are display-only for now. Copy works (client
 * clipboard).
 */
export function ItemDrawerDetail({
  item,
  onEdit,
  onDeleted,
}: {
  item: ItemDetail;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const value = copyValue(item);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail (permissions / insecure context); ignore silently.
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header: type + action bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-10 py-6">
        <div className="flex min-w-0 items-center gap-2">
          <ItemTypeBadge type={item.itemType} size="sm" />
          <span className="truncate text-sm font-medium text-foreground">
            {typeHeading(item.itemType.name)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label={item.isPinned ? "Unpin item" : "Pin item"}
            aria-pressed={item.isPinned}
          >
            <Pin
              className={cn(
                "rotate-45",
                item.isPinned && "text-foreground",
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label={item.isFavorite ? "Unfavorite item" : "Favorite item"}
            aria-pressed={item.isFavorite}
          >
            <Star
              className={cn(
                item.isFavorite && "fill-amber-400 text-amber-400",
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Edit item"
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <DeleteItemButton
            itemId={item.id}
            itemTitle={item.title}
            onDeleted={onDeleted}
          />
          <SheetClose
            render={
              <Button variant="ghost" size="icon" type="button" aria-label="Close" />
            }
          >
            <X />
          </SheetClose>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 px-10 py-6">
        <div>
          <SheetTitle className="text-xl leading-tight wrap-break-word">
            {item.title}
          </SheetTitle>
          {item.description && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            Updated {item.updatedAt}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            Created {item.createdAt}
          </span>
        </div>

        {/* Content — code types get the Monaco editor (readonly), note/prompt get
            the Markdown preview; everything else keeps the boxed pre / link. */}
        {isCodeType(item.itemType.name) && item.contentType !== "URL" ? (
          <CodeEditor
            value={value}
            language={item.language}
            label={contentLabel(item)}
            readOnly
            ariaLabel={`${item.title} content`}
          />
        ) : isMarkdownType(item.itemType.name) ? (
          <MarkdownEditor
            value={value}
            readOnly
            ariaLabel={`${item.title} content`}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                {contentLabel(item)}
              </span>
              {value && (
                <Button
                  variant="ghost"
                  size="xs"
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy content"
                >
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </div>
            {item.contentType === "URL" && item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all p-4 font-mono text-xs text-primary hover:underline"
              >
                {item.url}
              </a>
            ) : (
              <pre className="overflow-x-auto p-4 font-mono text-xs whitespace-pre-wrap text-foreground">
                {value || (
                  <span className="text-muted-foreground">No content.</span>
                )}
              </pre>
            )}
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collections */}
        {item.collections.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              In collections
            </h3>
            <div className="flex flex-col gap-1.5">
              {item.collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: collection.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {collection.name}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Loading placeholder shown while the item detail is fetched. */
export function ItemDrawerSkeleton() {
  return (
    <div className="flex animate-pulse flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-10 py-6">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
        <div className="h-8 w-40 rounded bg-muted" />
      </div>
      <div className="flex flex-col gap-6 px-10 py-6">
        <div className="h-6 w-2/3 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-28 rounded bg-muted" />
          <div className="h-6 w-32 rounded bg-muted" />
        </div>
        <div className="h-40 w-full rounded-lg bg-muted" />
        <div className="flex gap-1.5">
          <div className="h-5 w-14 rounded bg-muted" />
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="h-5 w-12 rounded bg-muted" />
        </div>
        <div className="h-10 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}
