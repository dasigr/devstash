"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";

import { generateAutoTags } from "@/actions/ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/lib/toast";

interface SuggestTagsProps {
  /** Whether AI tagging is available (Pro). Hidden entirely for free users. */
  isPro: boolean;
  title: string;
  content: string;
  /** Tags already on the item — suggestions matching these are filtered out. */
  existingTags: string[];
  /** Called when the user accepts a suggestion. */
  onAccept: (tag: string) => void;
}

/**
 * Pro-only "Suggest tags" control shared by the create dialog and the drawer
 * edit form. Renders nothing for free users (UI gating; the server action
 * gates too). On click it asks OpenAI for freeform tags and shows them as
 * badges with accept (check) / reject (X) controls.
 */
export function SuggestTags({
  isPro,
  title,
  content,
  existingTags,
  onAccept,
}: SuggestTagsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  if (!isPro) return null;

  async function handleSuggest() {
    setPending(true);
    try {
      const result = await generateAutoTags({ title, content });
      if (!result.success) {
        toastManager.add({
          title: "Couldn't suggest tags",
          description: result.error,
          timeout: 6000,
        });
        return;
      }
      const existing = new Set(existingTags.map((t) => t.trim().toLowerCase()));
      const fresh = result.data.filter((t) => !existing.has(t));
      if (fresh.length === 0) {
        toastManager.add({
          title: "No new tags",
          description: "The AI didn't find any tags to add.",
          timeout: 4000,
        });
      }
      setSuggestions(fresh);
    } catch {
      toastManager.add({
        title: "Couldn't suggest tags",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  function accept(tag: string) {
    onAccept(tag);
    setSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  function reject(tag: string) {
    setSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <div className="mt-2 space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={pending || title.trim().length === 0}
        className="text-muted-foreground hover:text-foreground"
        onClick={handleSuggest}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Sparkles />
        )}
        Suggest tags
      </Button>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="gap-1 pr-1 pl-2 font-normal"
            >
              <span className="truncate">{tag}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Accept ${tag}`}
                className="size-4 text-muted-foreground hover:text-emerald-500"
                onClick={() => accept(tag)}
              >
                <Check />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Reject ${tag}`}
                className="size-4 text-muted-foreground hover:text-destructive"
                onClick={() => reject(tag)}
              >
                <X />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
