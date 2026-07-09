import { afterEach, describe, expect, it, vi } from "vitest";

import { buildObjectKey, r2KeyFromUrl, r2PublicUrl } from "@/lib/r2";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("r2KeyFromUrl", () => {
  it("extracts the object key (pathname without leading slash)", () => {
    expect(
      r2KeyFromUrl("https://pub.example.com/items/u1/abc-report.pdf"),
    ).toBe("items/u1/abc-report.pdf");
  });

  it("returns null for a non-URL or empty path", () => {
    expect(r2KeyFromUrl("not a url")).toBeNull();
    expect(r2KeyFromUrl("https://pub.example.com/")).toBeNull();
    expect(r2KeyFromUrl("https://pub.example.com")).toBeNull();
  });
});

describe("r2PublicUrl", () => {
  it("joins the public base and key, trimming a trailing slash on the base", () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://pub.example.com/");
    expect(r2PublicUrl("items/u1/x.png")).toBe(
      "https://pub.example.com/items/u1/x.png",
    );
  });
});

describe("buildObjectKey", () => {
  it("namespaces by user, keeps a sanitized readable name, and is unique", () => {
    const a = buildObjectKey("user_1", "My Report (final).pdf");
    const b = buildObjectKey("user_1", "My Report (final).pdf");

    expect(a).toMatch(/^items\/user_1\/[0-9a-f-]+-My-Report-final\.pdf$/);
    expect(a).not.toBe(b); // random prefix prevents collisions
  });

  it("preserves the lowercased extension", () => {
    expect(buildObjectKey("u", "PHOTO.PNG")).toMatch(/-PHOTO\.png$/);
  });
});
