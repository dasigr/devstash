"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { createItem } from "@/actions/items";
import type { NewItemType } from "@/lib/validations/items";
import { fileExtension } from "@/lib/validations/upload";
import { toastManager } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { editorLanguageLabel, isCodeType, isMarkdownType } from "@/lib/code-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";
import { FileUpload, type UploadedFile } from "@/components/dashboard/FileUpload";
import { CollectionPicker } from "@/components/dashboard/CollectionPicker";
import { SuggestTags } from "@/components/dashboard/SuggestTags";

/** The selectable creatable types, with their display label / icon / color. */
const TYPES: {
  value: NewItemType;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "snippet", label: "Snippet", icon: "Code", color: "#3b82f6" },
  { value: "prompt", label: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { value: "note", label: "Note", icon: "StickyNote", color: "#fde047" },
  { value: "command", label: "Command", icon: "Terminal", color: "#f97316" },
  { value: "link", label: "Link", icon: "Link", color: "#10b981" },
  { value: "file", label: "File", icon: "File", color: "#6b7280" },
  { value: "image", label: "Image", icon: "Image", color: "#ec4899" },
];

// Which type-specific fields each type exposes (mirrors the edit form / spec).
const CONTENT_TYPES = new Set<NewItemType>([
  "snippet",
  "prompt",
  "command",
  "note",
]);
const LANGUAGE_TYPES = new Set<NewItemType>(["snippet", "command"]);
const URL_TYPES = new Set<NewItemType>(["link"]);
const FILE_TYPES = new Set<NewItemType>(["file", "image"]);

/** Trim a value and treat blank as null (matches the server-side coercion). */
function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * "New Item" button that opens a modal for creating an item. A type selector
 * drives which fields show; on submit it calls the `createItem` server action,
 * toasts, closes, and refreshes the list. Rendered in the dashboard top bar.
 *
 * `isPro` gates the file/image (Pro-only) types: for free users those chips are
 * disabled with an "Upgrade to Pro" hint (the server enforces this too).
 */
export function CreateItemDialog({ isPro = false }: { isPro?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [type, setType] = useState<NewItemType>("snippet");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState("");
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const showContent = CONTENT_TYPES.has(type);
  const showLanguage = LANGUAGE_TYPES.has(type);
  const showUrl = URL_TYPES.has(type);
  const showFile = FILE_TYPES.has(type);
  const useCodeEditor = isCodeType(type);
  const useMarkdownEditor = isMarkdownType(type);

  const titleEmpty = title.trim() === "";
  const urlMissing = showUrl && url.trim() === "";
  const fileMissing = showFile && !file;
  const submitDisabled =
    titleEmpty || urlMissing || fileMissing || uploading || pending;

  function reset() {
    setType("snippet");
    setTitle("");
    setDescription("");
    setContent("");
    setLanguage("");
    setUrl("");
    setFile(null);
    setUploading(false);
    setTags("");
    setCollectionIds([]);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  // Current tags as a clean list, and a helper to append one (deduped).
  const tagList = tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  function addTag(tag: string) {
    if (tagList.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    setTags(tagList.length > 0 ? `${tags.replace(/,\s*$/, "")}, ${tag}` : tag);
  }

  // Switching type clears the type-specific fields so stale file/content data
  // never rides along to a mismatched type. Free users can't select the
  // Pro-only file/image types (their chips are disabled too).
  function handleTypeChange(next: NewItemType) {
    if (FILE_TYPES.has(next) && !isPro) return;
    setType(next);
    setFile(null);
    setUploading(false);
    setError(null);
  }

  // Default the title to the uploaded filename (sans extension) when it's blank.
  function handleFileChange(next: UploadedFile | null) {
    setFile(next);
    if (next && title.trim() === "") {
      const ext = fileExtension(next.fileName);
      setTitle(ext ? next.fileName.slice(0, -ext.length) : next.fileName);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitDisabled) return;
    setError(null);

    const payload: Record<string, unknown> = {
      type,
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
    if (showFile && file) {
      payload.fileUrl = file.fileUrl;
      payload.fileName = file.fileName;
      payload.fileSize = file.fileSize;
    }

    setPending(true);
    try {
      const result = await createItem(payload);
      if (!result.success) {
        setError(result.error);
        toastManager.add({
          title: "Couldn't create item",
          description: result.error,
          timeout: 6000,
        });
        return;
      }

      toastManager.add({
        title: "Item created",
        description: `“${result.data.title}” has been added.`,
        timeout: 6000,
      });
      router.refresh();
      handleOpenChange(false);
    } catch {
      setError("Something went wrong. Please try again.");
      toastManager.add({
        title: "Couldn't create item",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button aria-label="New Item">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Item</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Pick a type, then fill in the details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
          {/* Type selector */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">Type</span>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => {
                const selected = t.value === type;
                const proLocked = FILE_TYPES.has(t.value) && !isPro;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleTypeChange(t.value)}
                    aria-pressed={selected}
                    disabled={proLocked}
                    title={proLocked ? "Upgrade to Pro to add files & images" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      proLocked
                        ? "cursor-not-allowed border-border text-muted-foreground opacity-50"
                        : selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <ItemTypeIcon
                      name={t.icon}
                      color={t.color}
                      className="size-4"
                    />
                    {t.label}
                    {proLocked && (
                      <span className="ml-0.5 rounded bg-muted px-1 text-[10px] font-medium uppercase tracking-wide">
                        Pro
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="new-item-title"
              className="text-sm font-medium text-foreground"
            >
              Title
            </label>
            <Input
              id="new-item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={titleEmpty}
              placeholder="A short, memorable name"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="new-item-description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <Textarea
              id="new-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </div>

          {showContent && (
            <div className="space-y-1.5">
              <label
                htmlFor="new-item-content"
                className="text-sm font-medium text-foreground"
              >
                Content
              </label>
              {useCodeEditor ? (
                <CodeEditor
                  value={content}
                  language={language}
                  label={editorLanguageLabel(language, type)}
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
                  id="new-item-content"
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
                htmlFor="new-item-language"
                className="text-sm font-medium text-foreground"
              >
                Language
              </label>
              <Input
                id="new-item-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. typescript"
              />
            </div>
          )}

          {showUrl && (
            <div className="space-y-1.5">
              <label
                htmlFor="new-item-url"
                className="text-sm font-medium text-foreground"
              >
                URL
              </label>
              <Input
                id="new-item-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={urlMissing}
                placeholder="https://…"
                required
              />
            </div>
          )}

          {showFile && (
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                {type === "image" ? "Image" : "File"}
              </span>
              <FileUpload
                kind={type === "image" ? "image" : "file"}
                value={file}
                onChange={handleFileChange}
                onUploadingChange={setUploading}
              />
            </div>
          )}

          <div className="relative space-y-1.5">
            <label
              htmlFor="new-item-tags"
              className="text-sm font-medium text-foreground"
            >
              Tags
            </label>
            <Input
              id="new-item-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma, separated, tags"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas.
            </p>
            <SuggestTags
              isPro={isPro}
              title={title}
              content={content}
              existingTags={tagList}
              onAccept={addTag}
            />
          </div>

          <CollectionPicker
            idPrefix="new-item-collection"
            value={collectionIds}
            onChange={setCollectionIds}
            disabled={pending}
          />

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {pending && <Loader2 className="animate-spin" />}
              Create item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
