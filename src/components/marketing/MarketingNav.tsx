"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

import { Logo } from "@/components/dashboard/Logo";
import { cn } from "@/lib/utils";
import { marketingButton } from "./marketing-button";

/**
 * Fixed marketing nav. Gains a blurred/opaque background once the page is
 * scrolled, and on mobile a hamburger toggles a dropdown holding the links +
 * actions (which are hidden on the desktop rail's collapsed state).
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        solid
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
        <Link href="/" aria-label="DevStash home" className="shrink-0">
          <Logo />
        </Link>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="ml-auto p-1 text-[var(--m-text)] md:hidden"
        >
          <Menu className="size-6" />
        </button>

        <nav
          aria-label="Primary"
          className={cn(
            "text-[0.94rem] text-[var(--m-text-dim)] md:absolute md:inset-y-0 md:left-1/2 md:flex md:-translate-x-1/2 md:flex-row md:items-center md:gap-6",
            open ? "flex basis-full flex-col gap-3" : "hidden"
          )}
        >
          <a href="#features" className="transition-colors hover:text-[var(--m-text)]">
            Features
          </a>
          <a href="#pricing" className="transition-colors hover:text-[var(--m-text)]">
            Pricing
          </a>
        </nav>

        <div
          className={cn(
            "items-center gap-2.5 md:ml-auto",
            open ? "flex basis-full flex-col gap-3" : "hidden md:flex"
          )}
        >
          <Link
            href="/sign-in"
            className={marketingButton({ variant: "ghost", block: open })}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={marketingButton({ variant: "primary", block: open })}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
