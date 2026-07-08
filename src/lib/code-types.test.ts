import { describe, it, expect } from "vitest";

import {
  isCodeType,
  isMarkdownType,
  monacoLanguage,
  editorLanguageLabel,
} from "@/lib/code-types";

describe("isCodeType", () => {
  it("is true for the code types", () => {
    expect(isCodeType("snippet")).toBe(true);
    expect(isCodeType("command")).toBe(true);
  });

  it("is false for non-code text types", () => {
    expect(isCodeType("prompt")).toBe(false);
    expect(isCodeType("note")).toBe(false);
    expect(isCodeType("link")).toBe(false);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(isCodeType("  Snippet  ")).toBe(true);
    expect(isCodeType("COMMAND")).toBe(true);
  });
});

describe("isMarkdownType", () => {
  it("is true for the markdown types", () => {
    expect(isMarkdownType("note")).toBe(true);
    expect(isMarkdownType("prompt")).toBe(true);
  });

  it("is false for code and other types", () => {
    expect(isMarkdownType("snippet")).toBe(false);
    expect(isMarkdownType("command")).toBe(false);
    expect(isMarkdownType("link")).toBe(false);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(isMarkdownType("  Note  ")).toBe(true);
    expect(isMarkdownType("PROMPT")).toBe(true);
  });

  it("is mutually exclusive with isCodeType", () => {
    for (const t of ["snippet", "command", "note", "prompt", "link"]) {
      expect(isMarkdownType(t) && isCodeType(t)).toBe(false);
    }
  });
});

describe("monacoLanguage", () => {
  it("falls back to plaintext for empty / nullish input", () => {
    expect(monacoLanguage(null)).toBe("plaintext");
    expect(monacoLanguage(undefined)).toBe("plaintext");
    expect(monacoLanguage("")).toBe("plaintext");
    expect(monacoLanguage("   ")).toBe("plaintext");
  });

  it("maps known aliases to Monaco ids", () => {
    expect(monacoLanguage("bash")).toBe("shell");
    expect(monacoLanguage("ts")).toBe("typescript");
    expect(monacoLanguage("js")).toBe("javascript");
    expect(monacoLanguage("py")).toBe("python");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(monacoLanguage("  Bash ")).toBe("shell");
    expect(monacoLanguage("TypeScript")).toBe("typescript");
  });

  it("passes through unknown languages lowercased", () => {
    expect(monacoLanguage("typescript")).toBe("typescript");
    expect(monacoLanguage("dockerfile")).toBe("dockerfile");
    expect(monacoLanguage("Rust")).toBe("rust");
  });
});

describe("editorLanguageLabel", () => {
  it("uses the language when present", () => {
    expect(editorLanguageLabel("bash", "command")).toBe("bash");
    expect(editorLanguageLabel("  TypeScript  ", "snippet")).toBe("TypeScript");
  });

  it("falls back to the capitalized type name when no language", () => {
    expect(editorLanguageLabel(null, "command")).toBe("Command");
    expect(editorLanguageLabel("", "snippet")).toBe("Snippet");
    expect(editorLanguageLabel("   ", "snippet")).toBe("Snippet");
  });
});
