import {
  Code,
  Search,
  Sparkles,
  Terminal,
  FileText,
  Layers,
  type LucideIcon,
} from "lucide-react";

/**
 * Data arrays that drive the marketing homepage's repeated cards. Accent colors
 * reference the marketing palette tokens (`--m-*`, defined in globals.css) — the
 * per-card `--c` is set to one of these so a card's markup never hardcodes a hex.
 */

export interface MarketingFeature {
  title: string;
  description: string;
  icon: LucideIcon;
  /** CSS var reference into the marketing accent palette. */
  accent: string;
}

export const FEATURES: MarketingFeature[] = [
  {
    title: "Code Snippets",
    description:
      "Syntax-highlighted, language-aware, copy in one click. Your reusable code, always at hand.",
    icon: Code,
    accent: "var(--m-snippet)",
  },
  {
    title: "AI Prompts",
    description:
      "Save the prompts that work. Version them, tag them, and pull the right one in seconds.",
    icon: Sparkles,
    accent: "var(--m-prompt)",
  },
  {
    title: "Instant Search",
    description:
      "Search across content, titles, tags, and types. A ⌘K palette that jumps to anything.",
    icon: Search,
    accent: "var(--m-url)",
  },
  {
    title: "Commands",
    description:
      "Stop re-deriving that Docker or git incantation. Stash it once, run it forever.",
    icon: Terminal,
    accent: "var(--m-command)",
  },
  {
    title: "Files & Docs",
    description:
      "Upload context files, images, and docs. Keep them beside the code they belong to.",
    icon: FileText,
    accent: "var(--m-file)",
  },
  {
    title: "Collections",
    description:
      "Group anything into collections — React Patterns, Interview Prep — an item can live in many.",
    icon: Layers,
    accent: "var(--m-note)",
  },
];

/** Mini dashboard-preview sidebar rows (label + accent). */
export const PREVIEW_NAV: { label: string; accent: string }[] = [
  { label: "Snippets", accent: "var(--m-snippet)" },
  { label: "Prompts", accent: "var(--m-prompt)" },
  { label: "Commands", accent: "var(--m-command)" },
  { label: "Notes", accent: "var(--m-note)" },
  { label: "Links", accent: "var(--m-url)" },
];

/** Accent per mini card in the dashboard-preview grid (12 cards). */
export const PREVIEW_CARDS: string[] = [
  "var(--m-snippet)",
  "var(--m-prompt)",
  "var(--m-command)",
  "var(--m-note)",
  "var(--m-url)",
  "var(--m-image)",
  "var(--m-snippet)",
  "var(--m-prompt)",
  "var(--m-command)",
  "var(--m-note)",
  "var(--m-url)",
  "var(--m-image)",
];

export type BillingPeriod = "monthly" | "yearly";

export interface PlanPrice {
  amount: string;
  per: string;
  tag: string;
}

export interface PricingPlan {
  name: string;
  featured: boolean;
  badge?: string;
  /** Per-period price. Free is identical across periods. */
  price: Record<BillingPeriod, PlanPrice>;
  features: string[];
  cta: { label: string; href: string; variant: "primary" | "outline" };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    featured: false,
    price: {
      monthly: { amount: "$0", per: "/forever", tag: "For getting organized." },
      yearly: { amount: "$0", per: "/forever", tag: "For getting organized." },
    },
    features: [
      "Up to 50 items",
      "3 collections",
      "All text & link types",
      "Basic search",
      "Dark mode",
    ],
    cta: { label: "Get Started", href: "/register", variant: "outline" },
  },
  {
    name: "Pro",
    featured: true,
    badge: "Most Popular",
    price: {
      monthly: { amount: "$8", per: "/month", tag: "Billed monthly." },
      yearly: { amount: "$6", per: "/month", tag: "$72 billed yearly." },
    },
    features: [
      "Unlimited items",
      "Unlimited collections",
      "File & image uploads",
      "Full search",
      "AI auto-tag, summaries & explain",
      "Prompt optimizer",
      "Export (JSON / ZIP)",
    ],
    cta: { label: "Go Pro", href: "/register", variant: "primary" },
  },
];

/** AI section checklist copy. */
export const AI_CHECKLIST: string[] = [
  "Auto-tag suggestions the moment you paste",
  "One-line summaries for long notes",
  "“Explain this code” on any snippet",
  "Prompt optimizer that sharpens your prompts",
];

/** AI "Generated Tags" demo chips. */
export const AI_TAGS: string[] = [
  "react",
  "hooks",
  "typescript",
  "debounce",
  "performance",
];

/** Footer link columns. Non-page links point at `#` placeholders. */
export const FOOTER_COLUMNS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blogs" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Support", href: "/support" },
    ],
  },
];
