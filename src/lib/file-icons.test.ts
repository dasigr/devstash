import { describe, it, expect } from "vitest";

import { fileIconCategory } from "@/lib/file-icons";

describe("fileIconCategory", () => {
  it("maps PDFs to the pdf category", () => {
    expect(fileIconCategory("report.pdf")).toBe("pdf");
  });

  it("maps image extensions to the image category", () => {
    for (const name of [
      "a.png",
      "a.jpg",
      "a.jpeg",
      "a.gif",
      "a.webp",
      "a.svg",
    ]) {
      expect(fileIconCategory(name)).toBe("image");
    }
  });

  it("maps structured/config formats to the code category", () => {
    for (const name of [
      "a.json",
      "a.xml",
      "a.yaml",
      "a.yml",
      "a.toml",
      "a.ini",
    ]) {
      expect(fileIconCategory(name)).toBe("code");
    }
  });

  it("maps csv to the spreadsheet category", () => {
    expect(fileIconCategory("data.csv")).toBe("spreadsheet");
  });

  it("maps plain-text formats to the text category", () => {
    expect(fileIconCategory("notes.txt")).toBe("text");
    expect(fileIconCategory("readme.md")).toBe("text");
  });

  it("is case-insensitive on the extension", () => {
    expect(fileIconCategory("REPORT.PDF")).toBe("pdf");
    expect(fileIconCategory("Photo.JPG")).toBe("image");
  });

  it("falls back to generic for unknown or missing extensions", () => {
    expect(fileIconCategory("archive.zip")).toBe("generic");
    expect(fileIconCategory("Makefile")).toBe("generic");
    expect(fileIconCategory("trailingdot.")).toBe("generic");
  });
});
