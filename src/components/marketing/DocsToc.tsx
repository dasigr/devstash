"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { DOCS_NAV } from "./constants";

/** Flat list of section ids to observe, derived from the TOC groups. */
const SECTION_IDS = DOCS_NAV.flatMap((group) =>
  group.links.map((link) => link.id)
);

/**
 * Documentation table of contents with an IntersectionObserver scroll-spy.
 * Renders the `DOCS_NAV` groups as in-page anchors; the section currently near
 * the top of the viewport gets `aria-current="location"` + active styling.
 * Sticky beside the content on desktop, a wrapped horizontal bordered row above
 * it on mobile.
 */
export function DocsToc() {
  const [activeId, setActiveId] = useState<string>(SECTION_IDS[0] ?? "");
  // Which sections currently intersect the band. The observer callback only
  // reports *changed* entries, so we accumulate the full set here and pick the
  // topmost — otherwise a lower section that just entered would win over a
  // higher one that's still intersecting.
  const intersecting = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;

    const pickActive = () => {
      // At the very bottom the last (often short) section can't scroll high
      // enough to reach the top band, so force it active — otherwise the final
      // TOC item would never highlight.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveId(SECTION_IDS[SECTION_IDS.length - 1]!);
        return;
      }
      // Topmost intersecting section in DOM order; keep the last active id when
      // nothing is in the band (between sections).
      const topmost = SECTION_IDS.find((id) => intersecting.current[id]);
      if (topmost) setActiveId(topmost);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersecting.current[entry.target.id] = entry.isIntersecting;
        }
        pickActive();
      },
      { rootMargin: "-84px 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", pickActive, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", pickActive);
    };
  }, []);

  return (
    <aside
      aria-label="Documentation"
      className="flex flex-wrap gap-x-8 gap-y-5 border-b border-[var(--m-border)] pb-6 md:sticky md:top-[88px] md:flex-col md:gap-y-[22px] md:border-b-0 md:pb-0"
    >
      {DOCS_NAV.map((group) => (
        <div key={group.heading} className="min-w-0">
          <h4 className="mb-2.5 text-[0.74rem] font-semibold uppercase tracking-[0.06em] text-[var(--m-text-mute)]">
            {group.heading}
          </h4>
          <ul className="flex flex-col gap-0.5">
            {group.links.map((link) => {
              const active = activeId === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    aria-current={active ? "location" : undefined}
                    className={cn(
                      "block rounded-lg px-2.5 py-1.5 text-[0.9rem] transition-colors",
                      active
                        ? "bg-[var(--m-surface)] text-[var(--m-brand)]"
                        : "text-[var(--m-text-dim)] hover:bg-[var(--m-surface)] hover:text-[var(--m-text)]"
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
