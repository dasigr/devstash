import { describe, expect, it } from "vitest";

import { createCollectionSchema } from "@/lib/validations/collections";

describe("createCollectionSchema", () => {
  it("accepts a name on its own", () => {
    const result = createCollectionSchema.safeParse({ name: "React Patterns" });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("React Patterns");
  });

  it("trims the name", () => {
    const result = createCollectionSchema.safeParse({
      name: "  React Patterns  ",
    });

    expect(result.data?.name).toBe("React Patterns");
  });

  it("rejects a missing name", () => {
    expect(createCollectionSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a blank or whitespace-only name", () => {
    expect(createCollectionSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createCollectionSchema.safeParse({ name: "   " }).success).toBe(
      false,
    );
  });

  it("coerces a blank description to null", () => {
    const result = createCollectionSchema.safeParse({
      name: "React Patterns",
      description: "   ",
    });

    expect(result.success).toBe(true);
    expect(result.data?.description).toBeNull();
  });

  it("trims a present description", () => {
    const result = createCollectionSchema.safeParse({
      name: "React Patterns",
      description: "  Hooks and helpers  ",
    });

    expect(result.data?.description).toBe("Hooks and helpers");
  });

  it("reports the failing field on its own path", () => {
    const result = createCollectionSchema.safeParse({ name: "" });

    expect(result.error?.issues[0].path).toEqual(["name"]);
  });
});
