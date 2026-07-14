import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * Presentational quick-help card for the Support page: a centered brand-tinted
 * icon tile + title + description, wrapped in a `next/link`. Ports the
 * prototype's `.help-card` (hover lift + brand glow). Mapped from `SUPPORT_HELP`.
 */
export function HelpCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[14px] border border-[var(--m-border)] bg-[var(--m-surface)] px-6 py-[30px] text-center transition-all duration-200 hover:-translate-y-1 hover:border-[var(--m-brand)] hover:shadow-[0_18px_40px_-24px_var(--m-brand-glow)]"
    >
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-[rgba(99,102,241,0.14)] text-[var(--m-brand)]">
        <Icon className="size-[22px]" />
      </div>
      <h3 className="mb-1.5 text-[1.08rem] font-semibold tracking-[-0.01em]">
        {title}
      </h3>
      <p className="text-[0.92rem] text-[var(--m-text-dim)]">{description}</p>
    </Link>
  );
}
