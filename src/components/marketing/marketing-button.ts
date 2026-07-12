import { cva, type VariantProps } from "class-variance-authority";

/**
 * Shared button look for the marketing homepage. The page uses its own accent
 * palette (indigo→violet brand gradient) which differs from the app's `Button`
 * primary, so CTAs style a `next/link` with this cva rather than the ShadCN
 * `Button`. Kept minimal: three variants, two sizes, an optional block modifier.
 */
export const marketingButton = cva(
  // Note: `border` sets the width only — each variant sets its own border color
  // so the `outline` color isn't clobbered by a shared `border-transparent`
  // (this cva has no tailwind-merge to resolve that conflict).
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border font-semibold whitespace-nowrap transition-all duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--m-bg)]",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[linear-gradient(135deg,var(--m-brand),var(--m-brand-2))] text-white shadow-[0_6px_20px_-6px_var(--m-brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--m-brand-glow)]",
        outline:
          "border-[var(--m-border-2)] text-[var(--m-text)] hover:border-[var(--m-brand)] hover:bg-[rgba(99,102,241,0.08)]",
        ghost:
          "border-transparent text-[var(--m-text-dim)] hover:text-[var(--m-text)]",
      },
      size: {
        default: "px-[18px] py-2.5 text-[0.94rem]",
        lg: "px-6 py-[13px] text-base",
      },
      block: {
        true: "flex w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      block: false,
    },
  }
);

export type MarketingButtonProps = VariantProps<typeof marketingButton>;
