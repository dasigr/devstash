// Pure mapping from a filename to a coarse icon category, so the file-list view
// can pick an icon by extension. Kept dependency-light (only the shared
// `fileExtension` helper) and free of React/lucide imports so it stays testable.

import { fileExtension } from "@/lib/validations/upload";

/** Coarse category used to choose which icon renders for a file row. */
export type FileIconCategory =
  | "pdf"
  | "image"
  | "code"
  | "spreadsheet"
  | "text"
  | "generic";

// Extension -> category. Covers the upload allow-list plus common image types;
// anything unmapped falls back to the generic file icon.
const CATEGORY_BY_EXTENSION: Record<string, FileIconCategory> = {
  ".pdf": "pdf",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".gif": "image",
  ".webp": "image",
  ".svg": "image",
  ".json": "code",
  ".xml": "code",
  ".yaml": "code",
  ".yml": "code",
  ".toml": "code",
  ".ini": "code",
  ".csv": "spreadsheet",
  ".txt": "text",
  ".md": "text",
};

/** The icon category for a filename, derived from its extension. */
export function fileIconCategory(fileName: string): FileIconCategory {
  return CATEGORY_BY_EXTENSION[fileExtension(fileName)] ?? "generic";
}
