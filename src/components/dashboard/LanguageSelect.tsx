"use client";

import { languageOptions } from "@/lib/code-types";

// Matches the native <select> styling used in EditorPreferencesForm.
const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30";

/**
 * Native-select language picker for the code editor. Options come from the
 * curated `EDITOR_LANGUAGES`, with the current value always present (see
 * `languageOptions`). Selecting a language drives Monaco highlighting live.
 */
export function LanguageSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const options = languageOptions(value);
  return (
    <select
      id={id}
      className={selectClass}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value || "__plain"} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
