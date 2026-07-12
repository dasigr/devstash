# AI Integration Plan

> Research + implementation plan for DevStash's Pro-only AI features using the
> **official OpenAI Node SDK**. This is a *plan*, not shipped code — nothing here
> exists in `src/` yet. It was regenerated fresh against the current codebase
> (which now has the full Stripe/Pro-gating stack, `plan.ts`, `rate-limit.ts`,
> and the first server actions).

## Scope

The four AI features from `context/project-overview.md` §3F ("AI Features (Pro
only)"):

| Feature | Input | Output | Storage |
| --- | --- | --- | --- |
| **AI auto-tag** | item title + content | a short list of tag names | suggested, user accepts → written as tags |
| **AI summary** | item content | 1–3 sentence summary | ephemeral (or a future `Item.summary` column) |
| **Explain this code** | snippet/command content + language | a Markdown explanation | ephemeral (rendered in the drawer) |
| **Prompt optimizer** | a prompt item's content | an improved prompt | suggested, user accepts → replaces content |

All four are **Pro-only** per §7 Monetization ("AI auto-tagging / code
explanation / prompt optimizer ✅ Pro"). During development everything is
unlocked, but the gate must be built in from the start (see §8).

**Decision (locked):** this plan uses the **raw `openai` package only** —
`OPENAI_API_KEY`, the Responses API, and Zod/JSON-schema structured output. The
Vercel AI SDK / AI Gateway path is intentionally **out of scope**.

---

## 0. Findings about the current codebase (read before planning)

Any AI code must mirror these existing conventions — they're load-bearing and
repeatedly enforced across the project's history.

- **No AI deps installed.** `package.json` has `stripe` and `zod` but no
  `openai` / `@ai-sdk/*`. This plan adds exactly one dependency: `openai`.
- **`src/lib/usage-limits.ts` does NOT exist.** The research prompt referenced
  it, but free-tier / Pro gating actually lives in **`src/lib/plan.ts`**
  (`canCreateItem`, `canCreateCollection`, `PRO_ITEM_TYPES`, `QuotaCheck`). Use
  that.
- **Lazy-memoized external clients.** `src/lib/stripe.ts` and `src/lib/r2.ts`
  both follow the same shape: a module-level `let client`, an
  `isXConfigured()` boolean guard, and a builder that constructs on first use
  and never throws when the key is missing (so importing the module is cheap).
  The OpenAI client must match this exactly.
- **Server actions return a single result shape.** `src/actions/items.ts`
  defines and every action returns
  `ActionResult<T> = { success: true; data: T } | { success: false; error: string; issues?: … }`.
- **Actions are guarded + validated the same way every time:** `"use server"`
  → `await auth()` (401-style early return) → `schema.safeParse(input)` with
  `z.flattenError(...).fieldErrors` on failure → delegate to a `src/lib/db/*`
  query or external call → `try/catch` mapping thrown errors to a **generic**
  user message while `console.error`-ing the real one.
- **`isPro` is read from the DB per request**, never from the JWT/session:
  `getCurrentUser()` in `src/lib/db/user.ts` returns it. `createItem` already
  does `const isPro = user?.isPro ?? false`.
- **Rate limiting is a registry + fail-open helper.** `src/lib/rate-limit.ts`
  has a typed `RATE_LIMITS` map, `checkRateLimit(key, identifier)` backed by
  Upstash, and **fails open** (allows through) when Upstash is unconfigured or
  errors.
- **Env feature flags are plain `process.env` reads.** `src/lib/features.ts`
  `isEmailVerificationEnabled()` → `process.env.X?.trim().toLowerCase() === "true"`,
  no imports (edge-safe).
- **Validation lives in `src/lib/validations/*`** and is the source of truth;
  client-side guards are UX only (`src/lib/validations/items.ts`).
- **Vitest scope is deliberately narrow:** only `src/actions/*` and `src/lib/*`
  (pure logic, mock the client with `vi.mock`). Components/pages are excluded.
- **Markdown is already rendered safely** for note/prompt content via
  `react-markdown` with **no `rehype-raw`** (no raw HTML) — the "Explain this
  code" output reuses this renderer.

---

## 1. SDK choice & model

**SDK:** the official [`openai`](https://github.com/openai/openai-node) Node
package. It ships first-class TypeScript types, the **Responses API**, and Zod
structured-output helpers (`openai/helpers/zod`).

```bash
npm i openai
```

**Model:** `gpt-5-nano` per `project-overview.md` §6 — the fastest/cheapest GPT-5
tier, well-suited to classification, extraction, summarization, and short
explanations.

- Pricing: **~$0.05 / 1M input tokens, ~$0.40 / 1M output tokens**.
- Context window: **400K tokens**; supports structured outputs + streaming.

> ⚠️ **Do not hardcode the model id.** Newer/cheaper-per-quality variants already
> exist (e.g. `gpt-5.4-nano`, `gpt-5.6`). Read the model from an env var
> (`OPENAI_MODEL`, defaulting to `gpt-5-nano`) so it can be bumped without a code
> change — the same reason `stripe.ts` reads price ids from env.

---

## 2. Configuration & the AI client

New file `src/lib/openai.ts`, following `src/lib/stripe.ts` line for line:

```ts
import OpenAI from "openai";

// Server-side OpenAI client for Pro AI features. Mirrors the lazy pattern in
// src/lib/stripe.ts and src/lib/r2.ts: built on first use and memoized, so
// importing this module is cheap and never throws when OPENAI_API_KEY is unset.
// Callers guard with isOpenAIConfigured() before using openai().

let client: OpenAI | null = null;

/** Whether the OpenAI API key needed to talk to the API is present. */
export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Lazily build (and memoize) the OpenAI client. */
export function openai(): OpenAI {
  if (client) return client;
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
  return client;
}

/** The chat model id, overridable via env (defaults to the cheap nano tier). */
export function aiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5-nano";
}
```

Plus an env feature flag mirroring `src/lib/features.ts` (lets AI be turned off
globally without unsetting the key):

```ts
// in src/lib/features.ts
export function isAiEnabled(): boolean {
  return process.env.AI_FEATURES_ENABLED?.trim().toLowerCase() === "true";
}
```

**Env vars** (add to `.env` and document in `.env.example`):

```bash
# AI features (Pro) — server-only, never NEXT_PUBLIC_*
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5-nano"       # override to bump the model without a code change
AI_FEATURES_ENABLED="false"     # default off until a key is provisioned
```

---

## 3. Server Action patterns

The four features are server actions in a new `src/actions/ai.ts`, each
following `src/actions/items.ts` to the letter (`"use server"`, `auth()` guard,
Zod parse, delegate, try/catch, `ActionResult<T>`). Actions — not API routes —
because there's no client-side `fetch` needed and no webhook/streaming
requirement for the short outputs (see §4).

**Worked example — auto-tag (end to end):**

```ts
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import type { ActionResult } from "@/actions/items";
import { getCurrentUser } from "@/lib/db/user";
import { isAiEnabled } from "@/lib/features";
import { isOpenAIConfigured } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rate-limit";
import { suggestTags } from "@/lib/ai/tags";           // the OpenAI call (see §5)
import { autoTagSchema } from "@/lib/validations/ai";

export async function suggestItemTags(
  input: unknown,
): Promise<ActionResult<{ tags: string[] }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  // Pro gate — always re-read isPro from the DB, never trust the client.
  const user = await getCurrentUser();
  if (!user?.isPro) {
    return { success: false, error: "AI features are available on Pro." };
  }

  if (!isAiEnabled() || !isOpenAIConfigured()) {
    return { success: false, error: "AI features are not available right now." };
  }

  const parsed = autoTagSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Per-user rate limit — AI calls cost real money (see §6).
  const { success: allowed } = await checkRateLimit("ai", session.user.id);
  if (!allowed) {
    return { success: false, error: "You're doing that too fast. Try again shortly." };
  }

  try {
    const tags = await suggestTags(parsed.data);       // returns string[]
    return { success: true, data: { tags } };
  } catch (error) {
    console.error("AI auto-tag failed:", error);
    return { success: false, error: "Couldn't generate tags. Please try again." };
  }
}
```

`explainCode`, `summarizeItem`, and `optimizePrompt` are the same skeleton with
different schemas + `src/lib/ai/*` callers. The Pro + AI-enabled + rate-limit
preamble is identical enough to extract into a small `guardAi(session)` helper.

---

## 4. Streaming vs non-streaming

**Recommendation: non-streaming for all four.** Tags, summaries, and prompt
rewrites are short; a single `responses.parse` (or `responses.create`) call
returns fast and keeps the clean `ActionResult<T>` contract. Server actions also
don't stream tokens to the client well — that needs a route handler.

- **Non-streaming** (this plan): `await openai().responses.parse(...)`, one round
  trip, structured result, easy error handling.
- **Streaming** (optional later polish, only for "Explain this code" if
  explanations get long): use a **route handler** (`src/app/api/ai/explain/route.ts`)
  with `openai().responses.stream(...)` and pipe tokens to the client — do **not**
  try to stream from a server action. Defer unless the UX demands it.

---

## 5. Structured output (the OpenAI call)

Use the **Responses API** with a Zod schema via `openai/helpers/zod`. Example
for auto-tag (`src/lib/ai/tags.ts`):

```ts
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { openai, aiModel } from "@/lib/openai";

// OpenAI strict structured output: every field required, no extra properties.
// Prefer .nullable() over .optional()/.nullish() — optional fields break strict
// schemas and cause "no object generated" errors.
const TagResult = z.object({
  tags: z.array(z.string()).max(8),
});

export async function suggestTags(input: {
  title: string;
  content: string;
}): Promise<string[]> {
  const response = await openai().responses.parse({
    model: aiModel(),
    max_output_tokens: 120,                 // cap output — cost control (§7)
    input: [
      {
        role: "system",
        content:
          "You suggest 3–6 short, lowercase, single-or-two-word tags for a " +
          "developer's saved snippet/note. Return tags only.",
      },
      {
        role: "user",
        content: `Title: ${input.title}\n\nContent:\n${input.content}`,
      },
    ],
    text: { format: zodTextFormat(TagResult, "tags") },
  });

  return response.output_parsed?.tags ?? [];
}
```

**Strict-schema gotchas** (documented by OpenAI + the AI ecosystem):

- The schema is compiled with `strict: true` → **every property must be
  `required`** and the object must have `additionalProperties: false`. Zod
  `.optional()` violates this — use **`.nullable()`** and handle `null`.
- Keep schemas flat and small; deeply nested/recursive schemas are rejected or
  slow.
- `response.output_parsed` is typed from the Zod schema; treat a `null`/empty
  result as a soft failure (return `[]` / surface a retry), not a crash.

The equivalent raw form (no Zod helper) is `text.format` with a hand-written
`{ type: "json_schema", name, strict: true, schema }` — the helper just
generates that from Zod.

---

## 6. Error handling & rate limiting

**Errors** — the OpenAI SDK throws typed errors; catch and map to generic
messages (never leak provider detail to the user):

```ts
import OpenAI from "openai";

try {
  // ... openai() call
} catch (error) {
  if (error instanceof OpenAI.RateLimitError) {
    // 429 from OpenAI — advise retry (consider short exponential backoff)
  } else if (error instanceof OpenAI.APIConnectionError) {
    // network / timeout
  } else if (error instanceof OpenAI.APIError) {
    // other 4xx/5xx — inspect error.status
  }
  console.error("AI call failed:", error);
  // → return { success: false, error: "Couldn't complete that. Please try again." }
}
```

**Rate limiting** — add an `ai` entry to the `RATE_LIMITS` registry in
`src/lib/rate-limit.ts`, keyed by **userId** (AI calls cost money, unlike the
existing IP-keyed auth limiters):

```ts
// in RATE_LIMITS
ai: { limit: 20, window: "1 h", prefix: "rl:ai" },
```

Then `await checkRateLimit("ai", session.user.id)` in each action (shown in §3).
It **fails open** if Upstash is down — acceptable, and consistent with the auth
limiters. This is a burst/abuse guard; hard monthly quotas are a separate
concern (see §7).

---

## 7. Cost optimization

- **`gpt-5-nano` as the default** — cheapest tier; only escalate a specific
  feature to a bigger model if quality demands it (env-configurable per §1).
- **Cap input** — truncate item content before prompting (e.g. first ~4–8K
  chars). Long files blow up input cost for little gain on tag/summary tasks.
- **Cap output** — `max_output_tokens` per feature (tags ~120, summary ~200,
  explain ~800). Output tokens are 8× the input price.
- **Tight prompts** — short system prompts; don't restate the whole app.
- **Per-user quota** — optionally track monthly AI calls (a counter keyed by
  `userId:YYYY-MM`, e.g. in Upstash) and block past a Pro allowance; distinct
  from the per-hour burst limiter in §6.
- **Skip redundant calls** — don't re-summarize/re-tag unchanged content; let
  the user trigger AI explicitly rather than auto-firing on every edit.

---

## 8. Pro gating patterns

- Every AI action **re-reads `isPro` via `getCurrentUser()`** and returns an
  upgrade-style error when false (shown in §3) — never trust a client flag. This
  is the same discipline `createItem` uses.
- Extend **`src/lib/plan.ts`** with a small helper so the gate reads uniformly,
  e.g.:

  ```ts
  /** AI features are Pro-only (see project-overview §7). */
  export function canUseAi(isPro: boolean): boolean {
    return isPro;
  }
  ```

  (`PRO_ITEM_TYPES` already models Pro-gated capabilities in this file, so AI
  gating belongs alongside it.)
- **UI:** free users see the AI affordances **disabled with a "Pro" badge**
  linking to `/upgrade`, exactly like the New Item dialog's file/image chips
  already do. The server action is still the enforcement point; the disabled UI
  is UX.

---

## 9. UI patterns for AI features

- **Loading states** — a spinner/pending state on the trigger button while the
  action runs (the actions are `async`; use `useTransition` or local pending
  state, as the existing forms do).
- **Accept / reject suggestions** — AI never writes silently:
  - **Auto-tag:** show suggested tags as chips the user can add/remove, then the
    existing item-edit save writes them (reuse `updateItem`). Nothing persists
    until the user confirms.
  - **Prompt optimizer:** show the rewritten prompt in a diff/preview with
    "Replace" / "Discard"; on accept, write via `updateItem`.
  - **Summary / Explain:** render read-only in a drawer panel (Explain uses the
    existing **sanitized Markdown renderer** — see §10).
- **Toasts** — success/error via `src/lib/toast.ts` (`toastManager.add`),
  matching every other mutation in the app.
- Wire these into the existing **item drawer** (`ItemDrawer*` components) and its
  edit mode rather than new pages.

---

## 10. Security considerations

- **API key is server-only.** `OPENAI_API_KEY` is read only in
  `src/lib/openai.ts`, imported only by server actions / server code. **Never**
  `NEXT_PUBLIC_*`, never referenced in a client component. Server actions run on
  the server, so the key never reaches the browser.
- **Bound user input.** Truncate/normalize item content before it becomes a
  prompt (also a cost control). Very large inputs should be rejected by the Zod
  schema (`.max(...)`).
- **Treat model output as untrusted.** Render "Explain this code" and summaries
  through the **existing `react-markdown` renderer with no `rehype-raw`** (no raw
  HTML execution) — the same safe path note/prompt content already uses. Don't
  `dangerouslySetInnerHTML` model output.
- **Prompt injection.** Item content is attacker-controllable (a user could
  paste "ignore previous instructions…"). Keep the system prompt authoritative,
  never let model output trigger side effects automatically (accept/reject gate
  in §9 is the mitigation), and don't feed model output back into privileged
  operations.
- **Own-data only.** AI actions operate on the signed-in user's own items;
  reuse the owner-scoped queries (`getItemDetail(id, userId)`) if an action
  loads an item by id.

---

## 11. Suggested file layout (all new)

```
src/lib/openai.ts               # lazy client + isOpenAIConfigured() + aiModel()
src/lib/features.ts             # + isAiEnabled()            (edit existing)
src/lib/plan.ts                 # + canUseAi()               (edit existing)
src/lib/rate-limit.ts           # + RATE_LIMITS.ai           (edit existing)
src/lib/validations/ai.ts       # Zod input schemas per feature
src/lib/ai/tags.ts              # suggestTags()   — OpenAI call + output schema
src/lib/ai/summary.ts           # summarize()
src/lib/ai/explain.ts           # explainCode()
src/lib/ai/optimize.ts          # optimizePrompt()
src/lib/ai/prompts.ts           # (optional) shared system-prompt strings
src/actions/ai.ts               # the four "use server" actions (ActionResult<T>)
```

**Tests** (Vitest scope = actions + lib only, `vi.mock` the OpenAI client):

```
src/actions/ai.test.ts          # unauth guard, non-Pro guard, validation issues,
                                #   rate-limit block, success, thrown → generic
src/lib/validations/ai.test.ts  # each input schema
src/lib/ai/*.test.ts            # output-schema mapping with a mocked client
```

---

## 12. Open questions to resolve before building

- **Model pin vs. latest** — ship `gpt-5-nano` (env-overridable) or start on a
  newer nano variant? Default: pin `gpt-5-nano`, override via `OPENAI_MODEL`.
- **Do summaries persist?** Ephemeral (regenerate on demand) or a new
  `Item.summary` column? Persisting means a **Prisma migration** (never
  `db push`) and cache-invalidation on edit. Default: ephemeral first.
- **Streaming for Explain** — worth a route handler now, or non-streaming until
  the UX demands it? Default: non-streaming (§4).
- **Monthly AI quota** — is the per-hour burst limiter (§6) enough, or does Pro
  need a hard monthly cap (§7)? Needs a product decision + number.
- **Which features ship first?** Auto-tag is the lowest-risk, highest-value
  starting point (structured output, accept/reject already fits the edit flow).

---

## Sources

- [GPT-5 nano model — OpenAI API](https://developers.openai.com/api/docs/models/gpt-5-nano)
- [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)
- [Structured outputs / Responses API `text.format`](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI error codes & handling](https://developers.openai.com/api/docs/guides/error-codes)
- [`openai` Node SDK](https://github.com/openai/openai-node) — `openai/helpers/zod` (`zodTextFormat`, `responses.parse`)
- Codebase patterns: `src/actions/items.ts`, `src/lib/plan.ts`, `src/lib/stripe.ts`, `src/lib/r2.ts`, `src/lib/rate-limit.ts`, `src/lib/features.ts`, `src/lib/validations/items.ts`, `src/lib/db/user.ts`
