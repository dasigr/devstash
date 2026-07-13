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
 * Code types whose language is fixed and so don't show the language picker —
 * commands are effectively always Shell / Bash. The value is the Monaco id used
 * for highlighting regardless of any stored language.
 */
const FIXED_LANGUAGES: Record<string, string> = { command: "shell" };

/** True when a code type should show the language dropdown (i.e. isn't fixed). */
export function showsLanguagePicker(typeName: string): boolean {
  const key = typeName.trim().toLowerCase();
  return isCodeType(key) && !(key in FIXED_LANGUAGES);
}

/**
 * The effective language for a code type's editor/highlighting: a fixed
 * language (commands -> shell) wins over any stored value; otherwise the item's
 * own language is used.
 */
export function effectiveLanguage(
  typeName: string,
  language?: string | null,
): string | null {
  return FIXED_LANGUAGES[typeName.trim().toLowerCase()] ?? language ?? null;
}

/** Item types whose content is Markdown — shown in the `MarkdownEditor`. */
export const MARKDOWN_ITEM_TYPES = new Set(["note", "prompt"]);

/** True when a type's content should use the Markdown editor rather than a textarea. */
export function isMarkdownType(typeName: string): boolean {
  return MARKDOWN_ITEM_TYPES.has(typeName.trim().toLowerCase());
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

/** An option in the language dropdown. `value` is the stored language id; "" = none. */
export interface EditorLanguageOption {
  value: string;
  label: string;
}

/**
 * Curated languages for the code-editor dropdown. Values are Monaco language
 * ids (so `monacoLanguage` recognizes them directly); "" is the plaintext / no
 * language default. Kept here (pure) so the list stays testable.
 */
export const EDITOR_LANGUAGES: EditorLanguageOption[] = [
  { value: "", label: "Plain text" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "shell", label: "Shell / Bash" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "markdown", label: "Markdown" },
  { value: "dockerfile", label: "Dockerfile" },
];

/**
 * Canonicalize a stored language to its curated option value when it matches
 * one case-insensitively (e.g. "TypeScript" -> "typescript"); otherwise return
 * the trimmed original. Used to seed the dropdown so a controlled `<select>`
 * finds a matching option.
 */
export function normalizeLanguage(current?: string | null): string {
  const value = current?.trim() ?? "";
  if (value === "") return "";
  const match = EDITOR_LANGUAGES.find(
    (option) => option.value.toLowerCase() === value.toLowerCase(),
  );
  return match ? match.value : value;
}

/**
 * The dropdown options for a given current value. If the (trimmed) current
 * value isn't already a curated option, it's prepended as its own option — so
 * an existing item whose language isn't in the list (e.g. "bash") still shows
 * correctly instead of the `<select>` silently resetting to the first option.
 */
export function languageOptions(current?: string | null): EditorLanguageOption[] {
  const value = current?.trim() ?? "";
  if (value === "") return EDITOR_LANGUAGES;
  const exists = EDITOR_LANGUAGES.some((option) => option.value === value);
  return exists ? EDITOR_LANGUAGES : [{ value, label: value }, ...EDITOR_LANGUAGES];
}

/** Human-facing label for the editor header — the language, else the type name. */
export function editorLanguageLabel(
  language: string | null | undefined,
  typeName: string,
): string {
  const trimmed = language?.trim();
  if (trimmed) {
    const match = EDITOR_LANGUAGES.find(
      (option) => option.value.toLowerCase() === trimmed.toLowerCase(),
    );
    return match ? match.label : trimmed;
  }
  return typeName ? `${typeName[0].toUpperCase()}${typeName.slice(1)}` : typeName;
}
