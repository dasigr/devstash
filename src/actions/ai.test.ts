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

import { generateAutoTags } from "@/actions/ai";

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
