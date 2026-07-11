import Link from "next/link";

import { Logo } from "@/components/dashboard/Logo";
import { FOOTER_COLUMNS } from "./constants";

/**
 * Marketing footer: brand + tagline, three link columns, and the copyright line
 * (year rendered at request time).
 */
export function Footer() {
  return (
    <footer className="border-t border-[var(--m-border)] bg-[var(--m-bg-soft)] pb-8 pt-14">
      <div className="mx-auto grid w-full max-w-[1160px] grid-cols-1 gap-10 px-6 min-[900px]:grid-cols-[1.4fr_2fr]">
        <div>
          <Link href="/" aria-label="DevStash home" className="inline-flex">
            <Logo />
          </Link>
          <p className="mt-3.5 max-w-[260px] text-[0.92rem] text-[var(--m-text-mute)]">
            One home for all your developer knowledge.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-6 min-[560px]:grid-cols-3"
        >
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-[11px]">
              <h4 className="mb-1 text-[0.82rem] uppercase tracking-[0.06em] text-[var(--m-text-mute)]">
                {col.heading}
              </h4>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[0.92rem] text-[var(--m-text-dim)] transition-colors hover:text-[var(--m-text)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-10 w-full max-w-[1160px] border-t border-[var(--m-border)] px-6 pt-6 text-[0.86rem] text-[var(--m-text-mute)]">
        <p>&copy; {new Date().getFullYear()} DevStash. All rights reserved.</p>
      </div>
    </footer>
  );
}
