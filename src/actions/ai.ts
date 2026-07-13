"use server";

import { z } from "zod";

import type { ActionResult } from "@/actions/items";
import { auth } from "@/auth";
import { parseSuggestedTags } from "@/lib/ai-tags";
import { getCurrentUser } from "@/lib/db/user";
import { aiModel, isOpenAIConfigured, openai } from "@/lib/openai";
import { canUseAi } from "@/lib/plan";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTO_TAG_CONTENT_LIMIT, autoTagSchema } from "@/lib/validations/ai";

const AUTO_TAG_INSTRUCTIONS =
  "You are a developer knowledge-base assistant. Given a saved item's title and " +
  "content, suggest 3 to 5 short, lowercase, freeform tags that would help a " +
  "developer find and organize it (languages, frameworks, concepts, purpose). " +
  'Respond ONLY with JSON of the form {"tags": ["tag1", "tag2"]}. Keep each tag ' +
  "to one or two words. Do not include explanations.";

/**
 * Suggest 3–5 freeform tags for an item using OpenAI (Pro-only). Follows the
 * standard action pattern: auth → configured → Pro gate → validate → rate limit
 * → call the model → parse. Uses the Responses API with json_object format
 * (gpt-5-nano returns empty content on Chat Completions and hits length limits
 * with structured output), then parses the text manually.
 */
export async function generateAutoTags(
  input: unknown,
): Promise<ActionResult<string[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  if (!isOpenAIConfigured()) {
    return { success: false, error: "AI is not available right now." };
  }

  const parsed = autoTagSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const user = await getCurrentUser();
  const isPro = user?.isPro ?? false;
  if (!canUseAi(isPro)) {
    return { success: false, error: "AI tagging is a Pro feature." };
  }

  const rate = await checkRateLimit("ai", session.user.id);
  if (!rate.success) {
    return {
      success: false,
      error: "You've used your AI tag suggestions for now. Try again later.",
    };
  }

  const { title, content } = parsed.data;
  const truncated = content.slice(0, AUTO_TAG_CONTENT_LIMIT);
  // The word "json" must appear in the input itself (not only the
  // instructions) for the Responses API json_object format to be accepted.
  const promptInput =
    'Suggest tags for this item. Respond as JSON of the form ' +
    '{"tags": ["tag1", "tag2"]}.\n\n' +
    `Title: ${title}\n\nContent:\n${truncated}`;

  try {
    const response = await openai().responses.create({
      model: aiModel(),
      instructions: AUTO_TAG_INSTRUCTIONS,
      input: promptInput,
      text: { format: { type: "json_object" } },
    });

    const tags = parseSuggestedTags(response.output_text ?? "");
    return { success: true, data: tags };
  } catch (error) {
    console.error("Failed to generate auto tags:", error);
    return { success: false, error: "Something went wrong generating tags." };
  }
}
