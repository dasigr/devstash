import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ContentType } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// System item types (isSystem = true, no owner). See context/features/seed-spec.md
// ---------------------------------------------------------------------------

const itemTypes = [
  { id: "type_snippet", name: "snippet", icon: "Code", color: "#3b82f6" },
  { id: "type_prompt", name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { id: "type_command", name: "command", icon: "Terminal", color: "#f97316" },
  { id: "type_note", name: "note", icon: "StickyNote", color: "#fde047" },
  { id: "type_file", name: "file", icon: "File", color: "#6b7280" },
  { id: "type_image", name: "image", icon: "Image", color: "#ec4899" },
  { id: "type_link", name: "link", icon: "Link", color: "#10b981" },
] as const;

// ---------------------------------------------------------------------------
// Collections + their items. Each item lists a typeId and the storage-shape
// fields relevant to it (content/language, url, or file*).
// ---------------------------------------------------------------------------

type SeedItem = {
  title: string;
  typeId: string;
  description?: string;
  content?: string;
  language?: string;
  url?: string;
  tags: string[];
};

type SeedCollection = {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  items: SeedItem[];
};

const collections: SeedCollection[] = [
  {
    id: "col_react_patterns",
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    isFavorite: true,
    items: [
      {
        title: "useDebounce hook",
        typeId: "type_snippet",
        language: "typescript",
        description: "Debounce a fast-changing value",
        tags: ["react", "hooks", "typescript"],
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}`,
      },
      {
        title: "Theme context provider",
        typeId: "type_snippet",
        language: "typescript",
        description: "Compound-component style context provider with a typed hook",
        tags: ["react", "context", "patterns"],
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}`,
      },
      {
        title: "cn() class merge utility",
        typeId: "type_snippet",
        language: "typescript",
        description: "Merge Tailwind classes without conflicts",
        tags: ["utility", "tailwind", "typescript"],
        content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}`,
      },
    ],
  },
  {
    id: "col_ai_workflows",
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    isFavorite: true,
    items: [
      {
        title: "Senior code reviewer",
        typeId: "type_prompt",
        description: "Thorough PR review prompt",
        tags: ["review", "system", "meta"],
        content: `You are a meticulous senior software engineer reviewing a pull request.
Focus on correctness, edge cases, security, and performance — not style nits.
For each issue: cite the file and line, explain the impact, and suggest a concrete fix.
End with a short summary and an APPROVE / REQUEST_CHANGES verdict.`,
      },
      {
        title: "Documentation generator",
        typeId: "type_prompt",
        description: "Generate reference docs from source",
        tags: ["docs", "generation"],
        content: `Given the following source code, write clear reference documentation.
Include: a one-line summary, parameters with types, return value, thrown errors,
and a minimal usage example. Use Markdown. Do not invent behavior that is not
present in the code.`,
      },
      {
        title: "Refactoring assistant",
        typeId: "type_prompt",
        description: "Safe, behavior-preserving refactors",
        tags: ["refactor", "cleanup"],
        content: `Refactor the provided code for readability and maintainability while preserving
behavior exactly. Explain each change and why it helps. Do not alter public APIs
or add new dependencies unless asked. Point out any risky assumptions.`,
      },
    ],
  },
  {
    id: "col_devops",
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    isFavorite: false,
    items: [
      {
        title: "Multi-stage Node Dockerfile",
        typeId: "type_snippet",
        language: "dockerfile",
        description: "Slim production image via multi-stage build",
        tags: ["docker", "ci", "node"],
        content: `FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]`,
      },
      {
        title: "Deploy migrations then app",
        typeId: "type_command",
        language: "bash",
        description: "Run pending migrations before starting the server",
        tags: ["deploy", "prisma", "ci"],
        content: "npx prisma migrate deploy && npm run start",
      },
      {
        title: "Docker docs — multi-stage builds",
        typeId: "type_link",
        description: "Official guide to multi-stage builds",
        url: "https://docs.docker.com/build/building/multi-stage/",
        tags: ["docker", "reference"],
      },
      {
        title: "GitHub Actions documentation",
        typeId: "type_link",
        description: "CI/CD workflows reference",
        url: "https://docs.github.com/en/actions",
        tags: ["ci", "github", "reference"],
      },
    ],
  },
  {
    id: "col_terminal_commands",
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    isFavorite: false,
    items: [
      {
        title: "Undo last commit, keep changes",
        typeId: "type_command",
        language: "bash",
        description: "Soft-reset to the previous commit",
        tags: ["git", "reset"],
        content: "git reset --soft HEAD~1",
      },
      {
        title: "Prune Docker system",
        typeId: "type_command",
        language: "bash",
        description: "Reclaim space from unused images, containers, and volumes",
        tags: ["docker", "cleanup", "ops"],
        content: "docker system prune -af --volumes",
      },
      {
        title: "Kill process on a port",
        typeId: "type_command",
        language: "bash",
        description: "Find and kill whatever is listening on port 3000",
        tags: ["process", "ports", "unix"],
        content: "lsof -ti :3000 | xargs kill -9",
      },
      {
        title: "List globally installed npm packages",
        typeId: "type_command",
        language: "bash",
        description: "Top-level global packages only",
        tags: ["npm", "packages"],
        content: "npm list -g --depth=0",
      },
    ],
  },
  {
    id: "col_design_resources",
    name: "Design Resources",
    description: "UI/UX resources and references",
    isFavorite: true,
    items: [
      {
        title: "Tailwind CSS documentation",
        typeId: "type_link",
        description: "Utility-first CSS framework reference",
        url: "https://tailwindcss.com/docs",
        tags: ["css", "tailwind", "reference"],
      },
      {
        title: "shadcn/ui components",
        typeId: "type_link",
        description: "Copy-paste React component library",
        url: "https://ui.shadcn.com",
        tags: ["ui", "react", "components"],
      },
      {
        title: "Radix UI design system",
        typeId: "type_link",
        description: "Unstyled, accessible component primitives",
        url: "https://www.radix-ui.com",
        tags: ["design-system", "accessibility"],
      },
      {
        title: "Lucide icon library",
        typeId: "type_link",
        description: "Open-source icon set used across the app",
        url: "https://lucide.dev",
        tags: ["icons", "svg", "reference"],
      },
    ],
  },
];

/** Map a seed item's type to its stored ContentType + storage-shape fields. */
function contentFields(item: SeedItem) {
  if (item.url) {
    return { contentType: ContentType.URL, url: item.url };
  }
  return {
    contentType: ContentType.TEXT,
    content: item.content ?? null,
    language: item.language ?? null,
  };
}

/** The item type used as a collection's default: the type it holds most. */
function defaultTypeId(items: SeedItem[]): string {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.typeId, (counts.get(item.typeId) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

async function main() {
  // Idempotent: wipe seeded domain data (FK-safe order) before re-inserting.
  await prisma.itemCollection.deleteMany();
  await prisma.item.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.itemType.deleteMany();
  await prisma.user.deleteMany();

  // Demo user (credentials login — bcrypt hash, 12 rounds).
  const user = await prisma.user.create({
    data: {
      email: "test-engineer@a5project.com",
      name: "Demo User",
      password: await bcrypt.hash("12345678", 12),
      isPro: false,
      emailVerified: new Date(),
    },
  });

  // System item types.
  for (const type of itemTypes) {
    await prisma.itemType.create({
      data: {
        id: type.id,
        name: type.name,
        icon: type.icon,
        color: type.color,
        isSystem: true,
      },
    });
  }

  // Collections, each with its items, tags, and item↔collection links.
  for (const collection of collections) {
    await prisma.collection.create({
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isFavorite: collection.isFavorite,
        userId: user.id,
        defaultTypeId: defaultTypeId(collection.items),
      },
    });

    for (const item of collection.items) {
      await prisma.item.create({
        data: {
          title: item.title,
          description: item.description ?? null,
          userId: user.id,
          itemTypeId: item.typeId,
          ...contentFields(item),
          tags: {
            connectOrCreate: item.tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
          collections: {
            create: { collection: { connect: { id: collection.id } } },
          },
        },
      });
    }
  }

  const [users, types, cols, items, tags, links] = await Promise.all([
    prisma.user.count(),
    prisma.itemType.count(),
    prisma.collection.count(),
    prisma.item.count(),
    prisma.tag.count(),
    prisma.itemCollection.count(),
  ]);

  console.log("Seed complete:", { users, types, cols, items, tags, links });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });