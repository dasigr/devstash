import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AiSection } from "@/components/marketing/AiSection";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Pricing } from "@/components/marketing/Pricing";

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

        <CtaBand
          title="Ready to Organize Your Knowledge?"
          subtitle="Everything you know as a developer, in one fast, searchable home."
          ctaLabel="Start stashing — free"
          ctaHref="/register"
        />
      </main>

      <Footer />
    </div>
  );
}
