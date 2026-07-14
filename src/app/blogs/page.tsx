import type { Metadata } from "next";

import { BLOG_POSTS } from "@/components/marketing/constants";
import { BlogCard } from "@/components/marketing/BlogCard";
import { BlogFeatured } from "@/components/marketing/BlogFeatured";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Workflows, tips, and product updates from the DevStash team — on organizing snippets, prompts, commands, and everything developers stash.",
};

export default function BlogsPage() {
  const featured = BLOG_POSTS.find((post) => post.featured);
  const rest = BLOG_POSTS.filter((post) => !post.featured);

  return (
    <MarketingShell>
      {/* ---------- Page header ---------- */}
      <section className="px-6 pb-11 pt-[136px] text-center max-[560px]:pt-[112px]">
        <Reveal className="mx-auto w-full max-w-[1160px]">
          <span className="mb-5 inline-block rounded-full border border-[var(--m-border-2)] bg-white/[0.03] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[var(--m-text-dim)]">
            The DevStash Blog
          </span>
          <h1 className="text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold tracking-[-0.02em]">
            Stash smarter,{" "}
            <span className="bg-[linear-gradient(120deg,var(--m-brand)_0%,var(--m-brand-2)_45%,var(--m-image)_100%)] bg-clip-text text-transparent">
              ship faster
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-[1.12rem] text-[var(--m-text-dim)]">
            Workflows, deep dives, and product updates on organizing the
            knowledge developers rely on every day.
          </p>
        </Reveal>
      </section>

      {/* ---------- Posts ---------- */}
      <section className="px-6 pb-[90px] pt-4 max-[560px]:pb-[66px]">
        <div className="mx-auto w-full max-w-[1160px]">
          {featured && (
            <Reveal>
              <BlogFeatured post={featured} />
            </Reveal>
          )}
          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Reveal key={post.slug}>
                <BlogCard post={post} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
