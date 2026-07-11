"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from "@/lib/validations/editor-preferences";

const EditorPreferencesContext =
  createContext<EditorPreferences>(DEFAULT_EDITOR_PREFERENCES);

/**
 * Provides the signed-in user's saved editor preferences to client components
 * (chiefly `CodeEditor`). Seed `value` from `getEditorPreferences` on the server
 * so the editor renders with the right settings on first paint.
 */
export function EditorPreferencesProvider({
  value,
  children,
}: {
  value: EditorPreferences;
  children: ReactNode;
}) {
  return (
    <EditorPreferencesContext.Provider value={value}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

/**
 * Read the current editor preferences. Falls back to the defaults when no
 * provider is present, so `CodeEditor` works even outside a shell (rather than
 * throwing like `useItemDrawer`).
 */
export function useEditorPreferences(): EditorPreferences {
  return useContext(EditorPreferencesContext);
}
