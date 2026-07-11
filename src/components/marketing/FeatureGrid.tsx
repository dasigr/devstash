import { FEATURES } from "./constants";
import { Reveal } from "./Reveal";

/**
 * Six feature cards, each tinted by its item-type accent (top bar, icon tile,
 * and hover glow). Driven by the FEATURES data array.
 */
export function FeatureGrid() {
  return (
    <section id="features" className="py-[90px] max-[560px]:py-[66px]">
      <div className="mx-auto w-full max-w-[1160px] px-6">
        <Reveal className="mx-auto mb-[52px] max-w-[640px] text-center">
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-[-0.02em]">
            Everything you stash, one search away
          </h2>
          <p className="mt-3.5 text-[1.08rem] text-[var(--m-text-dim)]">
            Seven built-in types, unlimited collections, and search that actually
            finds it.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title}>
                <article
                  style={{ "--c": feature.accent } as React.CSSProperties}
                  className="group relative h-full overflow-hidden rounded-[14px] border border-[var(--m-border)] bg-[var(--m-surface)] px-6 py-[26px] transition-all duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--c)_45%,var(--m-border))] hover:shadow-[0_18px_40px_-22px_var(--c)]"
                >
                  <span className="absolute inset-x-0 top-0 h-[3px] bg-[var(--c)] opacity-90" />
                  <div className="mb-[18px] grid size-[46px] place-items-center rounded-xl bg-[color-mix(in_srgb,var(--c)_16%,transparent)] text-[var(--c)]">
                    <Icon className="size-[22px]" />
                  </div>
                  <h3 className="mb-2 text-[1.2rem] font-semibold tracking-[-0.02em]">
                    {feature.title}
                  </h3>
                  <p className="text-[0.96rem] text-[var(--m-text-dim)]">
                    {feature.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
