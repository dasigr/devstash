import { afterEach, describe, expect, it, vi } from "vitest";
import { getBaseUrl } from "@/lib/base-url";

function req(url = "http://localhost:3000/api/auth/register") {
  return new Request(url);
}

describe("getBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers AUTH_URL and strips a trailing slash", () => {
    vi.stubEnv("AUTH_URL", "https://devstash.app/");
    expect(getBaseUrl(req())).toBe("https://devstash.app");
  });

  it("falls back to NEXTAUTH_URL when AUTH_URL is unset", () => {
    vi.stubEnv("AUTH_URL", undefined);
    vi.stubEnv("NEXTAUTH_URL", "https://alt.example.com");
    expect(getBaseUrl(req())).toBe("https://alt.example.com");
  });

  it("uses the request origin outside production when unconfigured", () => {
    vi.stubEnv("AUTH_URL", undefined);
    vi.stubEnv("NEXTAUTH_URL", undefined);
    vi.stubEnv("NODE_ENV", "development");
    expect(getBaseUrl(req("http://localhost:3000/foo?x=1"))).toBe(
      "http://localhost:3000"
    );
  });

  it("throws in production when no URL is configured (Host header is untrusted)", () => {
    vi.stubEnv("AUTH_URL", undefined);
    vi.stubEnv("NEXTAUTH_URL", undefined);
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getBaseUrl(req())).toThrow(/AUTH_URL/);
  });
});
