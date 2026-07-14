import Link from "next/link";

import { marketingButton } from "./marketing-button";
import { Reveal } from "./Reveal";

/**
 * Closing call-to-action band: a centered gradient-topped panel with a heading,
 * subtitle, and a single primary CTA. Shared by the homepage and the About page.
 */
export function CtaBand({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="py-24 text-center max-[560px]:py-[66px]">
      <div className="mx-auto w-full max-w-[1160px] px-6">
        <Reveal className="mx-auto max-w-[720px] rounded-3xl border border-[var(--m-border-2)] bg-[radial-gradient(120%_120%_at_50%_0%,rgba(99,102,241,0.18),transparent_60%),var(--m-surface)] px-10 py-[60px] max-[560px]:px-6 max-[560px]:py-11">
          <h2 className="text-[clamp(1.9rem,4.5vw,2.8rem)] font-extrabold tracking-[-0.02em]">
            {title}
          </h2>
          <p className="mx-auto mb-[30px] mt-4 max-w-[480px] text-[1.1rem] text-[var(--m-text-dim)]">
            {subtitle}
          </p>
          <Link href={ctaHref} className={marketingButton({ size: "lg" })}>
            {ctaLabel}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
