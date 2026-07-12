"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Loader2 } from "lucide-react";

import { createCollection } from "@/actions/collections";
import { toastManager } from "@/lib/toast";
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

/** Trim a value and treat blank as null (matches the server-side coercion). */
function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * "New Collection" button that opens a modal for creating a collection. On
 * submit it calls the `createCollection` server action, toasts, closes, and
 * refreshes so the dashboard grid, sidebar, and stats pick up the new row.
 * Rendered in the dashboard top bar.
 */
export function CreateCollectionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nameEmpty = name.trim() === "";
  const submitDisabled = nameEmpty || pending;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setDescription("");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitDisabled) return;
    setError(null);

    setPending(true);
    try {
      const result = await createCollection({
        name: name.trim(),
        description: blankToNull(description),
      });
      if (!result.success) {
        setError(result.error);
        toastManager.add({
          title: "Couldn't create collection",
          description: result.error,
          timeout: 6000,
        });
        return;
      }

      toastManager.add({
        title: "Collection created",
        description: `“${result.data.name}” has been added.`,
        timeout: 6000,
      });
      router.refresh();
      handleOpenChange(false);
    } catch {
      setError("Something went wrong. Please try again.");
      toastManager.add({
        title: "Couldn't create collection",
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
          <Button variant="outline" aria-label="New Collection">
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">New Collection</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Group related items together. You can add items to it later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="new-collection-name"
              className="text-sm font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="new-collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={nameEmpty}
              placeholder="e.g. React Patterns"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="new-collection-description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <Textarea
              id="new-collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional"
            />
          </div>

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
              Create collection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
