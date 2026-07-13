"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Crown, Loader2, Sparkles } from "lucide-react";

import { optimizePrompt } from "@/actions/ai";
import { cn } from "@/lib/utils";
import { toastManager } from "@/lib/toast";
import { Button } from "@/components/ui/button";

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 400;

type Tab = "write" | "preview";

/** Config that enables the Pro-only "Optimize" feature (drawer read view only). */
export interface OptimizeConfig {
  /** Whether the signed-in user is Pro. Free users see a Crown + tooltip. */
  isPro: boolean;
  /** The item's title, sent to the model for context. */
  title: string;
  /** Called with the optimized prompt when the user confirms "Use this prompt". */
  onApply: (optimized: string) => void;
}

/** A single Write/Preview tab in the editor header. */
function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/**
 * A Markdown editor for note/prompt content. Mirrors `CodeEditor`'s framing —
 * a dark container with a header carrying a Copy button — but swaps Monaco for
 * a tabbed Write/Preview surface backed by `react-markdown` + `remark-gfm`.
 *
 * In readonly (display) mode only the Preview tab shows. In edit mode it
 * defaults to Write, with Preview available; pass `onChange` for editing.
 * Rendered Markdown is styled through the global `.markdown-preview` class.
 * Body height is fluid, capped at `MAX_HEIGHT` after which it scrolls.
 */
export function MarkdownEditor({
  value,
  readOnly = false,
  onChange,
  ariaLabel,
  placeholder,
  optimize,
}: {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  /** Enables the Pro-only "Optimize" feature. Omit to hide it (e.g. edit forms). */
  optimize?: OptimizeConfig;
}) {
  const [tab, setTab] = useState<Tab>(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState<string | null>(null);
  const [viewingOptimized, setViewingOptimized] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Readonly can only ever show Preview, regardless of the last-picked tab.
  const activeTab: Tab = readOnly ? "preview" : tab;

  // Grow the textarea with its content, capped at MAX_HEIGHT (then it scrolls).
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight))}px`;
  }, [value, activeTab]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail (permissions / insecure context); ignore silently.
    }
  }

  async function handleOptimize() {
    if (!optimize) return;
    setOptimizing(true);
    try {
      const result = await optimizePrompt({ title: optimize.title, content: value });
      if (!result.success) {
        toastManager.add({
          title: "Couldn't optimize this prompt",
          description: result.error,
          timeout: 6000,
        });
        return;
      }
      setOptimized(result.data);
      setViewingOptimized(true);
    } catch {
      toastManager.add({
        title: "Couldn't optimize this prompt",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    } finally {
      setOptimizing(false);
    }
  }

  // Confirm — hand the optimized prompt to the parent (loads it into edit mode).
  function handleUseOptimized() {
    if (optimized === null) return;
    optimize?.onApply(optimized);
    setOptimized(null);
    setViewingOptimized(false);
  }

  // Discard the optimized prompt and return to the original.
  function handleDiscardOptimized() {
    setOptimized(null);
    setViewingOptimized(false);
  }

  const showingOptimized = optimized !== null && viewingOptimized;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
      {/* Header: tabs (Write/Preview, or Prompt/Optimized once optimized) on the
          left; Optimize and Copy on the right. */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-[#2d2d2d] px-3 py-2">
        <div className="flex items-center gap-1">
          {optimized !== null ? (
            <>
              <TabButton
                active={!viewingOptimized}
                onClick={() => setViewingOptimized(false)}
              >
                Prompt
              </TabButton>
              <TabButton
                active={viewingOptimized}
                onClick={() => setViewingOptimized(true)}
              >
                Optimized
              </TabButton>
            </>
          ) : (
            <>
              {!readOnly && (
                <TabButton
                  active={activeTab === "write"}
                  onClick={() => setTab("write")}
                >
                  Write
                </TabButton>
              )}
              <TabButton
                active={activeTab === "preview"}
                onClick={() => setTab("preview")}
              >
                Preview
              </TabButton>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {optimize &&
            (optimize.isPro ? (
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={handleOptimize}
                disabled={optimizing}
                aria-label="Optimize prompt"
              >
                {optimizing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Optimize
              </Button>
            ) : (
              // Free users: a non-interactive affordance with a native tooltip
              // (matches the app's Pro-gating pattern). A <span> reliably shows
              // its title on hover, unlike a disabled <button>.
              <span
                title="AI features require Pro subscription"
                aria-label="Optimize prompt requires Pro subscription"
                className="inline-flex cursor-not-allowed items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                <Crown className="size-3.5" />
                Optimize
              </span>
            ))}
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
        </div>
      </div>

      {/* Body — the optimized prompt (with a confirm bar), else the Write
          textarea or rendered Preview. */}
      {showingOptimized && optimized !== null ? (
        <div>
          <div
            className="markdown-preview overflow-y-auto px-4 py-3"
            style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
            aria-label="Optimized prompt"
          >
            <Markdown remarkPlugins={[remarkGfm]}>{optimized}</Markdown>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
            <span className="mr-auto text-xs text-muted-foreground">
              Use this optimized prompt?
            </span>
            <Button
              variant="ghost"
              size="xs"
              type="button"
              onClick={handleDiscardOptimized}
            >
              Discard
            </Button>
            <Button size="xs" type="button" onClick={handleUseOptimized}>
              Use this prompt
            </Button>
          </div>
        </div>
      ) : activeTab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder ?? "Write Markdown…"}
          aria-label={ariaLabel ?? "Markdown content"}
          spellCheck={false}
          className="block w-full resize-none bg-transparent px-4 py-3 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        />
      ) : (
        <div
          className="markdown-preview overflow-y-auto px-4 py-3"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          aria-label={ariaLabel ? `${ariaLabel} preview` : "Markdown preview"}
        >
          {value.trim() ? (
            <Markdown remarkPlugins={[remarkGfm]}>{value}</Markdown>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  );
}
