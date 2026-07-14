import type { ReactNode } from "react";

import { proseClassName } from "./Prose";

/**
 * Wraps one documentation section: its anchor `id` (the scroll-spy target), a
 * scroll offset clearing the fixed nav, the shared marketing prose typography,
 * a docs-specific (larger) `h2`, and the border divider between consecutive
 * sections. Content is authored as inline JSX children in `page.tsx`.
 *
 * The `h2` overrides use `!` because the shared `proseClassName` already carries
 * an `[&_h2]` rule (a descendant selector that would otherwise out-specify a
 * plain utility on the element).
 */
export function DocsSection({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={[
        "scroll-mt-[84px]",
        proseClassName,
        // docs h2 is larger than the shared prose h2, and sits tight to the
        // divider above it (no top margin).
        "[&_h2]:!mt-0 [&_h2]:!mb-3.5 [&_h2]:!text-[clamp(1.45rem,4vw,1.7rem)]",
        // divider between consecutive sections
        "[&+&]:mt-10 [&+&]:border-t [&+&]:border-[var(--m-border)] [&+&]:pt-10",
      ].join(" ")}
    >
      {children}
    </section>
  );
}
