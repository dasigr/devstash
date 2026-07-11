"use client";

import * as React from "react";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import {
  EDITOR_THEMES,
  FONT_SIZES,
  TAB_SIZES,
  type EditorPreferences,
  type EditorTheme,
} from "@/lib/validations/editor-preferences";
import { toastManager } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Human-readable labels for the theme dropdown. */
const THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30";

/**
 * Editor preferences controls. Seeded from the user's saved preferences and
 * auto-saves on every change (no save button): each change optimistically
 * updates the local state, calls the server action, and confirms with a toast —
 * reverting if the save fails.
 */
export function EditorPreferencesForm({
  initial,
}: {
  initial: EditorPreferences;
}) {
  const [prefs, setPrefs] = React.useState(initial);
  const [pending, setPending] = React.useState(false);

  async function save(next: EditorPreferences) {
    const previous = prefs;
    setPrefs(next); // optimistic
    setPending(true);
    try {
      const result = await updateEditorPreferences(next);
      if (!result.success) {
        setPrefs(previous);
        toastManager.add({
          title: "Couldn't save",
          description: result.error,
          timeout: 6000,
        });
        return;
      }
      toastManager.add({
        title: "Preferences saved",
        description: "Your editor preferences have been updated.",
        timeout: 4000,
      });
    } catch {
      setPrefs(previous);
      toastManager.add({
        title: "Couldn't save",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  function update(patch: Partial<EditorPreferences>) {
    save({ ...prefs, ...patch });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Font size */}
        <div className="space-y-1.5">
          <label
            htmlFor="editor-font-size"
            className="text-sm font-medium text-foreground"
          >
            Font size
          </label>
          <select
            id="editor-font-size"
            className={selectClass}
            value={prefs.fontSize}
            disabled={pending}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        {/* Tab size */}
        <div className="space-y-1.5">
          <label
            htmlFor="editor-tab-size"
            className="text-sm font-medium text-foreground"
          >
            Tab size
          </label>
          <select
            id="editor-tab-size"
            className={selectClass}
            value={prefs.tabSize}
            disabled={pending}
            onChange={(e) => update({ tabSize: Number(e.target.value) })}
          >
            {TAB_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} spaces
              </option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div className="space-y-1.5">
          <label
            htmlFor="editor-theme"
            className="text-sm font-medium text-foreground"
          >
            Theme
          </label>
          <select
            id="editor-theme"
            className={selectClass}
            value={prefs.theme}
            disabled={pending}
            onChange={(e) => update({ theme: e.target.value as EditorTheme })}
          >
            {EDITOR_THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {THEME_LABELS[theme]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label
          htmlFor="editor-word-wrap"
          className={cn(
            "flex cursor-pointer items-center gap-2.5 text-sm text-foreground",
            pending && "pointer-events-none opacity-50",
          )}
        >
          <input
            id="editor-word-wrap"
            type="checkbox"
            className="size-4 shrink-0 accent-primary"
            checked={prefs.wordWrap}
            disabled={pending}
            onChange={(e) => update({ wordWrap: e.target.checked })}
          />
          <span>
            Word wrap
            <span className="ml-2 text-muted-foreground">
              Wrap long lines instead of scrolling horizontally.
            </span>
          </span>
        </label>

        <label
          htmlFor="editor-minimap"
          className={cn(
            "flex cursor-pointer items-center gap-2.5 text-sm text-foreground",
            pending && "pointer-events-none opacity-50",
          )}
        >
          <input
            id="editor-minimap"
            type="checkbox"
            className="size-4 shrink-0 accent-primary"
            checked={prefs.minimap}
            disabled={pending}
            onChange={(e) => update({ minimap: e.target.checked })}
          />
          <span>
            Minimap
            <span className="ml-2 text-muted-foreground">
              Show the code overview on the right edge.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
