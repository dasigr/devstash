import type { LucideIcon } from "lucide-react";

/**
 * Presentational tinted card, accented by its item-type color (top bar, optional
 * icon tile, and hover glow via the per-card `--c` var). Shared by the homepage
 * `FeatureGrid` and the About page's two card grids. `icon` is optional — the
 * About "Who it's for" grid renders cards without an icon tile.
 */
export function FeatureCard({
  title,
  description,
  accent,
  icon: Icon,
}: {
  title: string;
  description: string;
  /** CSS var reference into the marketing accent palette (`var(--m-*)`). */
  accent: string;
  icon?: LucideIcon;
}) {
  return (
    <article
      style={{ "--c": accent } as React.CSSProperties}
      className="group relative h-full overflow-hidden rounded-[14px] border border-[var(--m-border)] bg-[var(--m-surface)] px-6 py-[26px] transition-all duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--c)_45%,var(--m-border))] hover:shadow-[0_18px_40px_-22px_var(--c)]"
    >
      <span className="absolute inset-x-0 top-0 h-[3px] bg-[var(--c)] opacity-90" />
      {Icon && (
        <div className="mb-[18px] grid size-[46px] place-items-center rounded-xl bg-[color-mix(in_srgb,var(--c)_16%,transparent)] text-[var(--c)]">
          <Icon className="size-[22px]" />
        </div>
      )}
      <h3 className="mb-2 text-[1.2rem] font-semibold tracking-[-0.02em]">
        {title}
      </h3>
      <p className="text-[0.96rem] text-[var(--m-text-dim)]">{description}</p>
    </article>
  );
}
