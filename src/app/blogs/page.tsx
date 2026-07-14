import type { Metadata } from "next";

import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Blogs",
};

export default function BlogsPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-[1160px] px-6 pb-24 pt-[128px]">
        <h1 className="text-[clamp(2.3rem,6vw,4rem)] font-extrabold tracking-[-0.02em]">
          Blogs
        </h1>
      </section>
    </MarketingShell>
  );
}
