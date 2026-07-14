/**
 * The blog detail page's gradient hero panel (`.article__hero`): a tall,
 * rounded, bordered banner filled with the same layered brand/pink radial
 * gradient over `--m-surface-2` that `BlogFeatured`'s media uses. Purely
 * decorative, so `aria-hidden`. Height scales down on small screens.
 */
export function ArticleHero() {
  return (
    <div
      aria-hidden="true"
      className="h-[220px] rounded-[14px] border border-[var(--m-border)] sm:h-[280px] lg:h-[320px]"
      style={{
        background:
          "radial-gradient(100% 100% at 15% 15%, rgba(99,102,241,0.35), transparent 55%), radial-gradient(100% 100% at 85% 85%, rgba(236,72,153,0.22), transparent 55%), var(--m-surface-2)",
      }}
    />
  );
}
