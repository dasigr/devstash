import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the session, OpenAI client, user lookup, Pro gate, and rate limiter so
// the action's own logic (guards, validation, truncation, error mapping) runs
// without a network call. parseSuggestedTags + the Zod schema run for real.
const {
  auth,
  isOpenAIConfigured,
  responsesCreate,
  aiModel,
  getCurrentUser,
  canUseAi,
  checkRateLimit,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  isOpenAIConfigured: vi.fn(),
  responsesCreate: vi.fn(),
  aiModel: vi.fn(() => "gpt-5-nano"),
  getCurrentUser: vi.fn(),
  canUseAi: vi.fn(),
  checkRateLimit: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/openai", () => ({
  isOpenAIConfigured,
  aiModel,
  openai: () => ({ responses: { create: responsesCreate } }),
}));
vi.mock("@/lib/db/user", () => ({ getCurrentUser }));
vi.mock("@/lib/plan", () => ({ canUseAi }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));

import {
  explainCode,
  generateAutoTags,
  generateSummary,
  optimizePrompt,
} from "@/actions/ai";

const validInput = { title: "useDebounce hook", content: "export function..." };

describe("generateAutoTags action", () => {
  beforeEach(() => {
    auth.mockReset();
    isOpenAIConfigured.mockReset();
    responsesCreate.mockReset();
    getCurrentUser.mockReset();
    canUseAi.mockReset();
    checkRateLimit.mockReset();
    // Defaults: signed-in Pro user, key configured, under the rate limit.
    auth.mockResolvedValue({ user: { id: "user_1" } });
    isOpenAIConfigured.mockReturnValue(true);
    getCurrentUser.mockResolvedValue({ id: "user_1", isPro: true });
    canUseAi.mockReturnValue(true);
    checkRateLimit.mockResolvedValue({ success: true });
    responsesCreate.mockResolvedValue({ output_text: '{"tags":["react"]}' });
  });

  it("rejects an unauthenticated caller without calling OpenAI", async () => {
    auth.mockResolvedValue(null);

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("errors when OpenAI is not configured", async () => {
    isOpenAIConfigured.mockReturnValue(false);

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "AI is not available right now.",
    });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("returns validation issues for a blank title", async () => {
    const result = await generateAutoTags({ title: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues?.title).toBeDefined();
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks a non-Pro user without calling OpenAI", async () => {
    getCurrentUser.mockResolvedValue({ id: "user_1", isPro: false });
    canUseAi.mockReturnValue(false);

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "AI tagging is a Pro feature.",
    });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks a rate-limited user without calling OpenAI", async () => {
    checkRateLimit.mockResolvedValue({ success: false });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "You've used your AI tag suggestions for now. Try again later.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith("ai", "user_1");
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("returns the parsed, normalized tags on success", async () => {
    responsesCreate.mockResolvedValue({
      output_text: '{"tags":["React","react","TypeScript"]}',
    });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: true, data: ["react", "typescript"] });
  });

  it("truncates content to 2000 chars before the API call", async () => {
    await generateAutoTags({ title: "big", content: "x".repeat(2500) });

    const arg = responsesCreate.mock.calls[0][0];
    const xCount = (arg.input.match(/x/g) ?? []).length;
    expect(xCount).toBe(2000);
    expect(arg.model).toBe("gpt-5-nano");
    expect(arg.text).toEqual({ format: { type: "json_object" } });
    // json_object format requires the word "json" in the input itself.
    expect(arg.input).toMatch(/json/i);
  });

  it("maps a thrown OpenAI error to a generic message", async () => {
    responsesCreate.mockRejectedValue(new Error("boom"));

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong generating tags.",
    });
  });
});

describe("generateSummary action", () => {
  beforeEach(() => {
    auth.mockReset();
    isOpenAIConfigured.mockReset();
    responsesCreate.mockReset();
    getCurrentUser.mockReset();
    canUseAi.mockReset();
    checkRateLimit.mockReset();
    // Defaults: signed-in Pro user, key configured, under the rate limit.
    auth.mockResolvedValue({ user: { id: "user_1" } });
    isOpenAIConfigured.mockReturnValue(true);
    getCurrentUser.mockResolvedValue({ id: "user_1", isPro: true });
    canUseAi.mockReturnValue(true);
    checkRateLimit.mockResolvedValue({ success: true });
    responsesCreate.mockResolvedValue({
      output_text: "A React hook that debounces a value.",
    });
  });

  it("rejects an unauthenticated caller without calling OpenAI", async () => {
    auth.mockResolvedValue(null);

    const result = await generateSummary(validInput);

    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("errors when OpenAI is not configured", async () => {
    isOpenAIConfigured.mockReturnValue(false);

    const result = await generateSummary(validInput);

    expect(result).toEqual({
      success: false,
      error: "AI is not available right now.",
    });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("returns validation issues for a blank title", async () => {
    const result = await generateSummary({ title: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues?.title).toBeDefined();
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks a non-Pro user without calling OpenAI", async () => {
    getCurrentUser.mockResolvedValue({ id: "user_1", isPro: false });
    canUseAi.mockReturnValue(false);

    const result = await generateSummary(validInput);

    expect(result).toEqual({
      success: false,
      error: "AI summaries are a Pro feature.",
    });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks a rate-limited user without calling OpenAI", async () => {
    checkRateLimit.mockResolvedValue({ success: false });

    const result = await generateSummary(validInput);

    expect(result).toEqual({
      success: false,
      error: "You've used your AI requests for now. Try again later.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith("ai", "user_1");
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("returns the cleaned summary on success (no json format)", async () => {
    responsesCreate.mockResolvedValue({
      output_text: '  "A React hook that\n debounces a value."  ',
    });

    const result = await generateSummary(validInput);

    expect(result).toEqual({
      success: true,
      data: "A React hook that debounces a value.",
    });
    const arg = responsesCreate.mock.calls[0][0];
    expect(arg.model).toBe("gpt-5-nano");
    expect(arg.text).toBeUndefined();
  });

  it("errors when the model returns an empty description", async () => {
    responsesCreate.mockResolvedValue({ output_text: "   " });

    const result = await generateSummary(validInput);

    expect(result).toEqual({
      success: false,
      error: "The AI didn't return a description.",
    });
  });

  it("truncates content to 4000 chars before the API call", async () => {
    await generateSummary({ title: "big", content: "x".repeat(4500) });

    const arg = responsesCreate.mock.calls[0][0];
    const xCount = (arg.input.match(/x/g) ?? []).length;
    expect(xCount).toBe(4000);
  });

  it("sends title only when there is no content", async () => {
    await generateSummary({ title: "Just a title" });

    const arg = responsesCreate.mock.calls[0][0];
    expect(arg.input).toBe("Title: Just a title");
  });

  it("maps a thrown OpenAI error to a generic message", async () => {
    responsesCreate.mockRejectedValue(new Error("boom"));

    const result = await generateSummary(validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong generating the description.",
    });
  });
});

describe("explainCode action", () => {
  const explainInput = {
    title: "useDebounce hook",
    content: "export function useDebounce() {}",
    language: "typescript",
  };

  beforeEach(() => {
    auth.mockReset();
    isOpenAIConfigured.mockReset();
    responsesCreate.mockReset();
    getCurrentUser.mockReset();
    canUseAi.mockReset();
    checkRateLimit.mockReset();
    // Defaults: signed-in Pro user, key configured, under the rate limit.
    auth.mockResolvedValue({ user: { id: "user_1" } });
    isOpenAIConfigured.mockReturnValue(true);
    getCurrentUser.mockResolvedValue({ id: "user_1", isPro: true });
    canUseAi.mockReturnValue(true);
    checkRateLimit.mockResolvedValue({ success: true });
    responsesCreate.mockResolvedValue({
      output_text: "## What it does\n\nDebounces a value.",
    });
  });

  it("rejects an unauthenticated caller without calling OpenAI", async () => {
    auth.mockResolvedValue(null);

    const result = await explainCode(explainInput);

    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("errors when OpenAI is not configured", async () => {
    isOpenAIConfigured.mockReturnValue(false);

    const result = await explainCode(explainInput);

    expect(result).toEqual({
      success: false,
      error: "AI is not available right now.",
    });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("returns validation issues when content is empty", async () => {
    const result = await explainCode({ title: "x", content: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues?.content).toBeDefined();
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks a non-Pro user without calling OpenAI", async () => {
    getCurrentUser.mockResolvedValue({ id: "user_1", isPro: false });
    canUseAi.mockReturnValue(false);

    const result = await explainCode(explainInput);

    expect(result).toEqual({
      success: false,
      error: "AI code explanations are a Pro feature.",
    });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks a rate-limited user without calling OpenAI", async () => {
    checkRateLimit.mockResolvedValue({ success: false });

    const result = await explainCode(explainInput);

    expect(result).toEqual({
      success: false,
      error: "You've used your AI requests for now. Try again later.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith("ai", "user_1");
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("returns the cleaned explanation on success (no json format)", async () => {
    responsesCreate.mockResolvedValue({
      output_text: "```markdown\n## What it does\n\nDebounces.\n```",
    });

    const result = await explainCode(explainInput);

    expect(result).toEqual({
      success: true,
      data: "## What it does\n\nDebounces.",
    });
    const arg = responsesCreate.mock.calls[0][0];
    expect(arg.model).toBe("gpt-5-nano");
    expect(arg.text).toBeUndefined();
    expect(arg.input).toContain("Language: typescript");
  });

  it("errors when the model returns an empty explanation", async () => {
    responsesCreate.mockResolvedValue({ output_text: "   " });

    const result = await explainCode(explainInput);

    expect(result).toEqual({
      success: false,
      error: "The AI didn't return an explanation.",
    });
  });

  it("truncates content to 4000 chars before the API call", async () => {
    await explainCode({ title: "big", content: "x".repeat(4500) });

    const arg = responsesCreate.mock.calls[0][0];
    const xCount = (arg.input.match(/x/g) ?? []).length;
    expect(xCount).toBe(4000);
  });

  it("omits the language line when none is provided", async () => {
    await explainCode({ title: "cmd", content: "ls -la" });

    const arg = responsesCreate.mock.calls[0][0];
    expect(arg.input).not.toContain("Language:");
  });

  it("maps a thrown OpenAI error to a generic message", async () => {
    responsesCreate.mockRejectedValue(new Error("boom"));

    const result = await explainCode(explainInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong generating the explanation.",
    });
  });
});

describe("optimizePrompt action", () => {
  const optimizeInput = {
    title: "Senior code reviewer",
    content: "Review this code and suggest improvements.",
  };

  beforeEach(() => {
    auth.mockReset();
    isOpenAIConfigured.mockReset();
    responsesCreate.mockReset();
    getCurrentUser.mockReset();
    canUseAi.mockReset();
    checkRateLimit.mockReset();
    // Defaults: signed-in Pro user, key configured, under the rate limit.
    auth.mockResolvedValue({ user: { id: "user_1" } });
    isOpenAIConfigured.mockReturnValue(true);
    getCurrentUser.mockResolvedValue({ id: "user_1", isPro: true });
    canUseAi.mockReturnValue(true);
    checkRateLimit.mockResolvedValue({ success: true });
    responsesCreate.mockResolvedValue({
      output_text: "You are a senior code reviewer. Review the code below…",
    });
  });

  it("rejects an unauthenticated caller without calling OpenAI", async () => {
    auth.mockResolvedValue(null);

    const result = await optimizePrompt(optimizeInput);

    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("errors when OpenAI is not configured", async () => {
    isOpenAIConfigured.mockReturnValue(false);

    const result = await optimizePrompt(optimizeInput);

    expect(result).toEqual({
      success: false,
      error: "AI is not available right now.",
    });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("returns validation issues when content is empty", async () => {
    const result = await optimizePrompt({ title: "x", content: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues?.content).toBeDefined();
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks a non-Pro user without calling OpenAI", async () => {
    getCurrentUser.mockResolvedValue({ id: "user_1", isPro: false });
    canUseAi.mockReturnValue(false);

    const result = await optimizePrompt(optimizeInput);

    expect(result).toEqual({
      success: false,
      error: "AI prompt optimization is a Pro feature.",
    });
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks a rate-limited user without calling OpenAI", async () => {
    checkRateLimit.mockResolvedValue({ success: false });

    const result = await optimizePrompt(optimizeInput);

    expect(result).toEqual({
      success: false,
      error: "You've used your AI requests for now. Try again later.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith("ai", "user_1");
    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it("returns the cleaned optimized prompt on success (no json format)", async () => {
    responsesCreate.mockResolvedValue({
      output_text: "```text\nYou are a senior code reviewer.\n```",
    });

    const result = await optimizePrompt(optimizeInput);

    expect(result).toEqual({
      success: true,
      data: "You are a senior code reviewer.",
    });
    const arg = responsesCreate.mock.calls[0][0];
    expect(arg.model).toBe("gpt-5-nano");
    expect(arg.text).toBeUndefined();
    // Input carries the title as context but avoids mirror-able field labels.
    expect(arg.input).toContain("Senior code reviewer");
    expect(arg.input).toContain(optimizeInput.content);
  });

  it("errors when the model returns an empty prompt", async () => {
    responsesCreate.mockResolvedValue({ output_text: "   " });

    const result = await optimizePrompt(optimizeInput);

    expect(result).toEqual({
      success: false,
      error: "The AI didn't return an optimized prompt.",
    });
  });

  it("truncates content to 4000 chars before the API call", async () => {
    await optimizePrompt({ title: "big", content: "x".repeat(4500) });

    const arg = responsesCreate.mock.calls[0][0];
    const xCount = (arg.input.match(/x/g) ?? []).length;
    expect(xCount).toBe(4000);
  });

  it("maps a thrown OpenAI error to a generic message", async () => {
    responsesCreate.mockRejectedValue(new Error("boom"));

    const result = await optimizePrompt(optimizeInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong optimizing the prompt.",
    });
  });
});
