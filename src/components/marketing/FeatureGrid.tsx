import { FEATURES } from "./constants";
import { FeatureCard } from "./FeatureCard";
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
          {FEATURES.map((feature) => (
            <Reveal key={feature.title}>
              <FeatureCard
                title={feature.title}
                description={feature.description}
                accent={feature.accent}
                icon={feature.icon}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
