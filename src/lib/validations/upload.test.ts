import { describe, expect, it } from "vitest";

import {
  acceptAttribute,
  fileExtension,
  formatBytes,
  isUploadKind,
  UPLOAD_CONSTRAINTS,
  validateUpload,
} from "@/lib/validations/upload";

describe("isUploadKind", () => {
  it("accepts the two file kinds", () => {
    expect(isUploadKind("file")).toBe(true);
    expect(isUploadKind("image")).toBe(true);
  });

  it("rejects other values", () => {
    expect(isUploadKind("snippet")).toBe(false);
    expect(isUploadKind("")).toBe(false);
    expect(isUploadKind(null)).toBe(false);
    expect(isUploadKind(undefined)).toBe(false);
  });
});

describe("fileExtension", () => {
  it("returns the lowercased extension including the dot", () => {
    expect(fileExtension("Report.PDF")).toBe(".pdf");
    expect(fileExtension("photo.JPEG")).toBe(".jpeg");
    expect(fileExtension("archive.tar.gz")).toBe(".gz");
  });

  it("returns empty string when there is no extension", () => {
    expect(fileExtension("README")).toBe("");
    expect(fileExtension("trailingdot.")).toBe("");
  });
});

describe("acceptAttribute", () => {
  it("joins the kind's allowed extensions", () => {
    expect(acceptAttribute("image")).toBe(".png,.jpg,.jpeg,.gif,.webp,.svg");
    expect(acceptAttribute("file")).toContain(".pdf");
  });
});

describe("formatBytes", () => {
  it("formats bytes, KB, and MB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("returns empty string for invalid sizes", () => {
    expect(formatBytes(-1)).toBe("");
    expect(formatBytes(NaN)).toBe("");
  });
});

describe("validateUpload", () => {
  it("accepts a valid image", () => {
    expect(
      validateUpload("image", {
        name: "photo.png",
        size: 1024,
        type: "image/png",
      }),
    ).toEqual({ ok: true });
  });

  it("accepts a valid file with an empty browser MIME type", () => {
    expect(
      validateUpload("file", { name: "notes.md", size: 1024, type: "" }),
    ).toEqual({ ok: true });
  });

  it("rejects an empty file", () => {
    const result = validateUpload("file", {
      name: "empty.pdf",
      size: 0,
      type: "application/pdf",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a file over the size limit", () => {
    const result = validateUpload("image", {
      name: "big.png",
      size: UPLOAD_CONSTRAINTS.image.maxBytes + 1,
      type: "image/png",
    });
    expect(result).toEqual({ ok: false, error: "Image must be 5MB or smaller." });
  });

  it("rejects a disallowed extension", () => {
    const result = validateUpload("image", {
      name: "malware.exe",
      size: 1024,
      type: "application/octet-stream",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Unsupported");
  });

  it("rejects a mismatched non-empty MIME type", () => {
    const result = validateUpload("image", {
      name: "photo.png",
      size: 1024,
      type: "application/x-msdownload",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an image extension used for the file kind", () => {
    // .png is not in the file kind's allowed extensions.
    const result = validateUpload("file", {
      name: "photo.png",
      size: 1024,
      type: "image/png",
    });
    expect(result.ok).toBe(false);
  });
});
