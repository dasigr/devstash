/**
 * Which item types render in a code editor (Monaco) vs. a plain textarea, and
 * how a stored free-text language maps to a Monaco language id. Kept pure and
 * dependency-free so it can back both the client editor and the unit tests.
 */

/** Item types whose content is code — shown in the Monaco `CodeEditor`. */
export const CODE_ITEM_TYPES = new Set(["snippet", "command"]);

/** True when a type's content should use the code editor rather than a textarea. */
export function isCodeType(typeName: string): boolean {
  return CODE_ITEM_TYPES.has(typeName.trim().toLowerCase());
}

/**
 * Map a stored, free-text language (e.g. "bash", "ts", "TypeScript") to a
 * Monaco language id. Unknown languages pass through lowercased so Monaco can
 * still match its own ids; blank/undefined falls back to "plaintext".
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  php: "php",
  py: "python",
  rb: "ruby",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "c#": "csharp",
};

export function monacoLanguage(language?: string | null): string {
  if (!language) return "plaintext";
  const key = language.trim().toLowerCase();
  if (key === "") return "plaintext";
  return LANGUAGE_ALIASES[key] ?? key;
}

/** Human-facing label for the editor header — the language, else the type name. */
export function editorLanguageLabel(
  language: string | null | undefined,
  typeName: string,
): string {
  const trimmed = language?.trim();
  if (trimmed) return trimmed;
  return typeName ? `${typeName[0].toUpperCase()}${typeName.slice(1)}` : typeName;
}
