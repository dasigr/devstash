import { describe, expect, it } from "vitest";

import { MAX_SUGGESTED_TAGS, parseSuggestedTags } from "@/lib/ai-tags";

describe("parseSuggestedTags", () => {
  it('parses the { "tags": [...] } object form', () => {
    expect(parseSuggestedTags('{"tags":["react","hooks"]}')).toEqual([
      "react",
      "hooks",
    ]);
  });

  it("parses a bare array form", () => {
    expect(parseSuggestedTags('["react","hooks"]')).toEqual(["react", "hooks"]);
  });

  it("lowercases and trims tags", () => {
    expect(parseSuggestedTags('["  React ","TypeScript"]')).toEqual([
      "react",
      "typescript",
    ]);
  });

  it("de-duplicates after normalization", () => {
    expect(parseSuggestedTags('["React","react","REACT"]')).toEqual(["react"]);
  });

  it("drops empty / whitespace-only entries", () => {
    expect(parseSuggestedTags('["react","","  "]')).toEqual(["react"]);
  });

  it("filters out non-string entries", () => {
    expect(parseSuggestedTags('{"tags":["react",1,null,true,"hooks"]}')).toEqual([
      "react",
      "hooks",
    ]);
  });

  it(`caps the result at ${MAX_SUGGESTED_TAGS}`, () => {
    const many = JSON.stringify(["a", "b", "c", "d", "e", "f", "g"]);
    expect(parseSuggestedTags(many)).toEqual(["a", "b", "c", "d", "e"]);
    expect(parseSuggestedTags(many)).toHaveLength(MAX_SUGGESTED_TAGS);
  });

  it("returns [] on non-JSON input", () => {
    expect(parseSuggestedTags("not json at all")).toEqual([]);
    expect(parseSuggestedTags("")).toEqual([]);
  });

  it("returns [] when the shape has no usable array", () => {
    expect(parseSuggestedTags('{"foo":"bar"}')).toEqual([]);
    expect(parseSuggestedTags('{"tags":"react"}')).toEqual([]);
    expect(parseSuggestedTags('"react"')).toEqual([]);
  });
});
