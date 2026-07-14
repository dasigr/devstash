import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Small brand-tinted note with a leading icon. Ported from the prototype's
 * `.callout`. Used inside `DocsSection`s (the "New here?" and "AI actions run
 * only when you click" notes).
 */
export function Callout({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="my-5 flex gap-3 rounded-[10px] border border-[color-mix(in_srgb,var(--m-brand)_30%,var(--m-border))] bg-[rgba(99,102,241,0.07)] p-4 text-[0.94rem] text-[var(--m-text)]">
      <span aria-hidden="true" className="shrink-0 text-[var(--m-brand)]">
        <Icon className="size-[18px]" />
      </span>
      <span>{children}</span>
    </div>
  );
}
