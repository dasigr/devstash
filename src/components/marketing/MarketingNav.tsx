"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/dashboard/Logo";
import { cn } from "@/lib/utils";
import { marketingButton } from "./marketing-button";

/**
 * Fixed marketing nav. Gains a blurred/translucent background once the page is
 * scrolled, and on mobile a hamburger toggles a dropdown holding the links +
 * actions (which are hidden on the desktop rail's collapsed state). The open
 * dropdown renders as a solid, opaque panel and closes on link tap, `Escape`,
 * or an outside click.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on Escape or a click/tap outside the header, and lock
  // body scroll while it's open so the page doesn't drift behind the overlay.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-[100] border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        open
          ? "border-[var(--m-border)] bg-[var(--m-bg)]"
          : solid
            ? "border-[var(--m-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-md"
            : "border-transparent bg-transparent"
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex h-16 w-full max-w-[1160px] items-center gap-6 px-6",
          open && "h-auto flex-wrap gap-y-3.5 pb-4"
        )}
      >
        {/* h-16 keeps the top row at the bar height even when the container
            grows to `h-auto` on open, so the logo/name/toggle don't shift up. */}
        <Link
          href="/"
          aria-label="DevStash home"
          className="flex h-16 shrink-0 items-center"
        >
          <Logo />
        </Link>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="ml-auto flex size-11 items-center justify-center text-[var(--m-text)] md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>

        <nav
          aria-label="Primary"
          className={cn(
            "text-[0.94rem] text-[var(--m-text-dim)] md:absolute md:inset-y-0 md:left-1/2 md:flex md:-translate-x-1/2 md:flex-row md:items-center md:gap-6",
            open ? "flex basis-full flex-col items-stretch gap-1" : "hidden"
          )}
        >
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="py-1.5 transition-colors hover:text-[var(--m-text)]"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="py-1.5 transition-colors hover:text-[var(--m-text)]"
          >
            Pricing
          </a>
        </nav>

        <div
          className={cn(
            "items-center gap-2.5 md:ml-auto",
            open
              ? "flex basis-full flex-col gap-2.5 border-t border-[var(--m-border)] pt-3.5"
              : "hidden md:flex"
          )}
        >
          <Link
            href="/sign-in"
            onClick={() => setOpen(false)}
            className={marketingButton({
              variant: open ? "outline" : "ghost",
              block: open,
            })}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className={marketingButton({ variant: "primary", block: open })}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
