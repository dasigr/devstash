import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AiSection } from "@/components/marketing/AiSection";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { marketingButton } from "@/components/marketing/marketing-button";
import { Pricing } from "@/components/marketing/Pricing";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "DevStash — Stop Losing Your Developer Knowledge",
  description:
    "DevStash is one fast, searchable, AI-enhanced hub for all your developer knowledge — snippets, prompts, commands, notes, files, and links.",
};

/**
 * Public marketing landing page. Signed-in visitors skip it and go straight to
 * the dashboard; logged-out visitors get the full marketing experience.
 */
export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="marketing relative isolate min-h-screen">
      {/* ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 0%, rgba(99,102,241,0.16), transparent 60%), radial-gradient(50% 45% at 90% 10%, rgba(236,72,153,0.10), transparent 60%), radial-gradient(60% 60% at 50% 100%, rgba(6,182,212,0.08), transparent 70%)",
        }}
      />

      <MarketingNav />

      <main>
        <Hero />
        <FeatureGrid />
        <AiSection />
        <Pricing />

        {/* CTA band */}
        <section className="py-24 text-center max-[560px]:py-[66px]">
          <div className="mx-auto w-full max-w-[1160px] px-6">
            <Reveal className="mx-auto max-w-[720px] rounded-3xl border border-[var(--m-border-2)] bg-[radial-gradient(120%_120%_at_50%_0%,rgba(99,102,241,0.18),transparent_60%),var(--m-surface)] px-10 py-[60px] max-[560px]:px-6 max-[560px]:py-11">
              <h2 className="text-[clamp(1.9rem,4.5vw,2.8rem)] font-extrabold tracking-[-0.02em]">
                Ready to Organize Your Knowledge?
              </h2>
              <p className="mx-auto mb-[30px] mt-4 max-w-[480px] text-[1.1rem] text-[var(--m-text-dim)]">
                Everything you know as a developer, in one fast, searchable home.
              </p>
              <Link href="/register" className={marketingButton({ size: "lg" })}>
                Start stashing — free
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
