"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 400;

type Tab = "write" | "preview";

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
}: {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const [tab, setTab] = useState<Tab>(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);
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

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#1e1e1e]">
      {/* Header: tabs + copy */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-[#2d2d2d] px-3 py-2">
        <div className="flex items-center gap-1">
          {!readOnly && (
            <TabButton active={activeTab === "write"} onClick={() => setTab("write")}>
              Write
            </TabButton>
          )}
          <TabButton
            active={activeTab === "preview"}
            onClick={() => setTab("preview")}
          >
            Preview
          </TabButton>
        </div>
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

      {/* Body — Write textarea or rendered Preview */}
      {activeTab === "write" ? (
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
