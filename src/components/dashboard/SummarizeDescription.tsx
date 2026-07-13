"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";

import { generateSummary } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/lib/toast";

interface SummarizeDescriptionProps {
  /** Whether AI summaries are available (Pro). Hidden entirely for free users. */
  isPro: boolean;
  title: string;
  /** The item's body text (content for text types). */
  content: string;
  /** Link URL — used as the body for link items that have no content. */
  url?: string;
  /** File name — used as the body for file/image items. */
  fileName?: string;
  /** Called when the user accepts (uses) the generated summary. */
  onApply: (summary: string) => void;
}

/**
 * Pro-only "Summarize" control shared by the create dialog and the drawer edit
 * form. Renders nothing for free users (UI gating; the server action gates
 * too). An icon-only button (absolutely positioned to the top-right of its
 * `relative` parent, aligned with the Description label) asks OpenAI for a 1–2
 * sentence description of the item from whatever info is available. The result
 * is shown as a preview below with Use / Dismiss controls — nothing overwrites
 * the Description field until the user clicks Use.
 */
export function SummarizeDescription({
  isPro,
  title,
  content,
  url,
  fileName,
  onApply,
}: SummarizeDescriptionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isPro) return null;

  async function handleSummarize() {
    setPending(true);
    try {
      // Best-available body: content, else the URL, else the file name.
      const body = content.trim() || url?.trim() || fileName?.trim() || "";
      const result = await generateSummary({ title, content: body });
      if (!result.success) {
        toastManager.add({
          title: "Couldn't generate a description",
          description: result.error,
          timeout: 6000,
        });
        return;
      }
      setSuggestion(result.data);
    } catch {
      toastManager.add({
        title: "Couldn't generate a description",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  function use() {
    if (suggestion) onApply(suggestion);
    setSuggestion(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={pending || title.trim().length === 0}
        className="absolute top-0 right-0 text-muted-foreground hover:text-foreground"
        onClick={handleSummarize}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Describe
      </Button>

      {suggestion && (
        <div className="mt-2 rounded-md border border-border bg-muted/40 p-3">
          <p className="text-sm text-foreground">{suggestion}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="gap-1"
              onClick={use}
            >
              <Check className="text-emerald-500" />
              Use
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setSuggestion(null)}
            >
              <X />
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
