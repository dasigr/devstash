// File / image upload constraints, shared by the client `FileUpload` component
// (UX pre-check) and the `/api/items/upload` route (the server-side source of
// truth). Pure — no Node/AWS imports — so it stays client-safe and testable.

/** The two Pro file-backed item types that accept uploads. */
export const UPLOAD_KINDS = ["file", "image"] as const;

export type UploadKind = (typeof UPLOAD_KINDS)[number];

/** Per-kind size, extension, and MIME constraints (from the feature spec). */
export const UPLOAD_CONSTRAINTS: Record<
  UploadKind,
  {
    /** Human label for messages, e.g. "Image". */
    label: string;
    /** Maximum accepted size in bytes. */
    maxBytes: number;
    /** Allowed lowercase extensions, including the leading dot. */
    extensions: readonly string[];
    /** Allowed MIME types (an empty browser-reported type is also accepted). */
    mimeTypes: readonly string[];
  }
> = {
  image: {
    label: "Image",
    maxBytes: 5 * 1024 * 1024,
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
  },
  file: {
    label: "File",
    maxBytes: 10 * 1024 * 1024,
    extensions: [
      ".pdf",
      ".txt",
      ".md",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".csv",
      ".toml",
      ".ini",
    ],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
};

/** Whether a string is one of the accepted upload kinds. */
export function isUploadKind(value: unknown): value is UploadKind {
  return (
    typeof value === "string" && (UPLOAD_KINDS as readonly string[]).includes(value)
  );
}

/** The lowercase extension of a filename including the dot, or "" if none. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === name.length - 1) return "";
  return name.slice(dot).toLowerCase();
}

/** The `accept` attribute value for a file input of the given kind. */
export function acceptAttribute(kind: UploadKind): string {
  return UPLOAD_CONSTRAINTS[kind].extensions.join(",");
}

/** Human-friendly byte size, e.g. 2048 -> "2 KB", 5_242_880 -> "5 MB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  // One decimal below 10 units, whole numbers above; drop a trailing ".0".
  const fmt = (n: number) =>
    (n < 10 ? n.toFixed(1) : String(Math.round(n))).replace(/\.0$/, "");
  const kb = bytes / 1024;
  if (kb < 1024) return `${fmt(kb)} KB`;
  return `${fmt(kb / 1024)} MB`;
}

export type UploadValidation =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Validate a candidate upload against its kind's constraints. Extension and size
 * are hard gates; the browser-reported MIME type is checked when present but an
 * empty type is tolerated (browsers often omit it for text-ish files).
 */
export function validateUpload(
  kind: UploadKind,
  file: { name: string; size: number; type: string },
): UploadValidation {
  const { label, maxBytes, extensions, mimeTypes } = UPLOAD_CONSTRAINTS[kind];

  if (file.size <= 0) {
    return { ok: false, error: "The file is empty." };
  }
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `${label} must be ${maxMb}MB or smaller.` };
  }

  const ext = fileExtension(file.name);
  if (!extensions.includes(ext)) {
    return {
      ok: false,
      error: `Unsupported ${label.toLowerCase()} type. Allowed: ${extensions.join(", ")}.`,
    };
  }

  if (file.type && !(mimeTypes as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      error: `Unsupported ${label.toLowerCase()} type (${file.type}).`,
    };
  }

  return { ok: true };
}
