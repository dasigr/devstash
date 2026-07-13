"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

import type { ItemDetail } from "@/lib/db/items";
import { updateItem } from "@/actions/items";
import { toastManager } from "@/lib/toast";
import { editorLanguageLabel, isCodeType, isMarkdownType } from "@/lib/code-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SheetTitle } from "@/components/ui/sheet";
import { ItemTypeBadge } from "@/components/dashboard/ItemTypeBadge";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";
import { CollectionPicker } from "@/components/dashboard/CollectionPicker";
import { SuggestTags } from "@/components/dashboard/SuggestTags";

/** Capitalized singular type name for the header, e.g. "snippet" -> "Snippet". */
function typeHeading(name: string): string {
  return name ? `${name[0].toUpperCase()}${name.slice(1)}` : name;
}

// Which type-specific fields each item type exposes, per the edit spec.
const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const URL_TYPES = new Set(["link"]);

/** Trim a value and treat blank as null (matches the server-side coercion). */
function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Inline edit form for the item drawer. Replaces the detail view's action bar
 * with Save / Cancel. Controlled local state (no form library); Save is disabled
 * while the title is empty. On success it refreshes the underlying card list
 * (`router.refresh()`) and hands the updated detail back so the drawer re-renders
 * without a second fetch.
 */
export function ItemDrawerEdit({
  item,
  isPro = false,
  onCancel,
  onSaved,
}: {
  item: ItemDetail;
  isPro?: boolean;
  onCancel: () => void;
  onSaved: (updated: ItemDetail) => void;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [tags, setTags] = useState(item.tags.join(", "));
  const [collectionIds, setCollectionIds] = useState<string[]>(
    item.collections.map((collection) => collection.id),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const typeName = item.itemType.name;
  const showContent = CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showUrl = URL_TYPES.has(typeName);
  const useCodeEditor = isCodeType(typeName);
  const useMarkdownEditor = isMarkdownType(typeName);

  const titleEmpty = title.trim() === "";

  // Current tags as a clean list, and a helper to append one (deduped).
  const tagList = tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  function addTag(tag: string) {
    if (tagList.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    setTags(tagList.length > 0 ? `${tags.replace(/,\s*$/, "")}, ${tag}` : tag);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (titleEmpty || pending) return;
    setError(null);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: blankToNull(description),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      collectionIds,
    };
    if (showContent) payload.content = content === "" ? null : content;
    if (showLanguage) payload.language = blankToNull(language);
    if (showUrl) payload.url = blankToNull(url);

    setPending(true);
    try {
      const result = await updateItem(item.id, payload);
      if (!result.success) {
        setError(result.error);
        toastManager.add({
          title: "Couldn't save changes",
          description: result.error,
          timeout: 6000,
        });
        return;
      }

      toastManager.add({
        title: "Changes saved",
        description: "Your item has been updated.",
        timeout: 6000,
      });
      router.refresh();
      onSaved(result.data);
    } catch {
      setError("Something went wrong. Please try again.");
      toastManager.add({
        title: "Couldn't save changes",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Header: type + Save / Cancel */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-10 py-6">
        <div className="flex min-w-0 items-center gap-2">
          <ItemTypeBadge type={item.itemType} size="sm" />
          <span className="truncate text-sm font-medium text-foreground">
            Edit {typeHeading(typeName)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onCancel}
            disabled={pending}
          >
            <X />
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={titleEmpty || pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-5 px-10 py-6">
        <SheetTitle className="sr-only">Edit {item.title}</SheetTitle>

        <div className="space-y-1.5">
          <label htmlFor="item-title" className="text-sm font-medium text-foreground">
            Title
          </label>
          <Input
            id="item-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={titleEmpty}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="item-description"
            className="text-sm font-medium text-foreground"
          >
            Description
          </label>
          <Textarea
            id="item-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional"
          />
        </div>

        {showContent && (
          <div className="space-y-1.5">
            <label
              htmlFor="item-content"
              className="text-sm font-medium text-foreground"
            >
              Content
            </label>
            {useCodeEditor ? (
              <CodeEditor
                value={content}
                language={language}
                label={editorLanguageLabel(language, typeName)}
                onChange={setContent}
                ariaLabel="Content"
              />
            ) : useMarkdownEditor ? (
              <MarkdownEditor
                value={content}
                onChange={setContent}
                ariaLabel="Content"
              />
            ) : (
              <Textarea
                id="item-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
            )}
          </div>
        )}

        {showLanguage && (
          <div className="space-y-1.5">
            <label
              htmlFor="item-language"
              className="text-sm font-medium text-foreground"
            >
              Language
            </label>
            <Input
              id="item-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. typescript"
            />
          </div>
        )}

        {showUrl && (
          <div className="space-y-1.5">
            <label htmlFor="item-url" className="text-sm font-medium text-foreground">
              URL
            </label>
            <Input
              id="item-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="item-tags" className="text-sm font-medium text-foreground">
            Tags
          </label>
          <Input
            id="item-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma, separated, tags"
          />
          <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
          <SuggestTags
            isPro={isPro}
            title={title}
            content={content}
            existingTags={tagList}
            onAccept={addTag}
          />
        </div>

        <CollectionPicker
          idPrefix="item-collection"
          value={collectionIds}
          onChange={setCollectionIds}
          disabled={pending}
        />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
