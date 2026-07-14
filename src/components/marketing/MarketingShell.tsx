import type { ReactNode } from "react";

import { Footer } from "./Footer";
import { MarketingNav } from "./MarketingNav";

/**
 * Shared marketing page shell: the `marketing` token scope + ambient background
 * glows, the fixed `MarketingNav`, a `<main>` for page content, and the
 * `Footer`. Mirrors the homepage chrome (`src/app/page.tsx`) so static pages
 * (About, Blogs, Docs, Support) render with the same header and footer.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
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

      <main>{children}</main>

      <Footer />
    </div>
  );
}
