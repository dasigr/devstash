"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Icon-only copy control for item cards. Stops click and key events from
 * reaching the surrounding card, which would otherwise open the item drawer.
 */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can fail (permissions / insecure context); ignore silently.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      type="button"
      aria-label={copied ? "Copied" : label}
      className="shrink-0 text-muted-foreground hover:text-foreground"
      onClick={(event) => {
        event.stopPropagation();
        void handleCopy();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
    </Button>
  );
}
