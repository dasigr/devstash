import { describe, it, expect } from "vitest";

import {
  isCodeType,
  isMarkdownType,
  monacoLanguage,
  editorLanguageLabel,
  normalizeLanguage,
  languageOptions,
  showsLanguagePicker,
  effectiveLanguage,
  EDITOR_LANGUAGES,
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
  });

  it("prefers the curated friendly label for a known language", () => {
    expect(editorLanguageLabel("typescript", "snippet")).toBe("TypeScript");
    expect(editorLanguageLabel("  TypeScript  ", "snippet")).toBe("TypeScript");
    expect(editorLanguageLabel("CPP", "snippet")).toBe("C++");
  });

  it("falls back to the capitalized type name when no language", () => {
    expect(editorLanguageLabel(null, "command")).toBe("Command");
    expect(editorLanguageLabel("", "snippet")).toBe("Snippet");
    expect(editorLanguageLabel("   ", "snippet")).toBe("Snippet");
  });
});

describe("EDITOR_LANGUAGES", () => {
  it("leads with the plaintext option and only that option is blank", () => {
    expect(EDITOR_LANGUAGES[0]).toEqual({ value: "", label: "Plain text" });
    const blanks = EDITOR_LANGUAGES.filter((o) => o.value === "");
    expect(blanks).toHaveLength(1);
  });

  it("stores lowercase Monaco ids with unique values", () => {
    const values = EDITOR_LANGUAGES.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      expect(value).toBe(value.toLowerCase());
    }
  });
});

describe("showsLanguagePicker", () => {
  it("is true only for snippet (code type without a fixed language)", () => {
    expect(showsLanguagePicker("snippet")).toBe(true);
    expect(showsLanguagePicker("  Snippet ")).toBe(true);
  });

  it("is false for command (fixed language) and non-code types", () => {
    expect(showsLanguagePicker("command")).toBe(false);
    expect(showsLanguagePicker("COMMAND")).toBe(false);
    expect(showsLanguagePicker("note")).toBe(false);
    expect(showsLanguagePicker("prompt")).toBe(false);
    expect(showsLanguagePicker("link")).toBe(false);
  });
});

describe("effectiveLanguage", () => {
  it("forces shell for commands regardless of stored value", () => {
    expect(effectiveLanguage("command", "bash")).toBe("shell");
    expect(effectiveLanguage("command", null)).toBe("shell");
    expect(effectiveLanguage("  Command ", undefined)).toBe("shell");
  });

  it("uses the item's own language for non-fixed types", () => {
    expect(effectiveLanguage("snippet", "typescript")).toBe("typescript");
    expect(effectiveLanguage("snippet", null)).toBeNull();
    expect(effectiveLanguage("snippet", undefined)).toBeNull();
  });
});

describe("normalizeLanguage", () => {
  it("returns empty for nullish / blank input", () => {
    expect(normalizeLanguage(null)).toBe("");
    expect(normalizeLanguage(undefined)).toBe("");
    expect(normalizeLanguage("   ")).toBe("");
  });

  it("canonicalizes a case-insensitive curated match", () => {
    expect(normalizeLanguage("TypeScript")).toBe("typescript");
    expect(normalizeLanguage("  PYTHON ")).toBe("python");
  });

  it("keeps an unknown language trimmed and as-is", () => {
    expect(normalizeLanguage("bash")).toBe("bash");
    expect(normalizeLanguage("  dockerfile ")).toBe("dockerfile");
  });
});

describe("languageOptions", () => {
  it("returns the curated list unchanged for blank / known values", () => {
    expect(languageOptions("")).toBe(EDITOR_LANGUAGES);
    expect(languageOptions(null)).toBe(EDITOR_LANGUAGES);
    expect(languageOptions("typescript")).toBe(EDITOR_LANGUAGES);
  });

  it("prepends an unknown current value so the select can reflect it", () => {
    const options = languageOptions("bash");
    expect(options[0]).toEqual({ value: "bash", label: "bash" });
    expect(options).toHaveLength(EDITOR_LANGUAGES.length + 1);
  });
});
