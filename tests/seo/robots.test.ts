import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";

afterEach(() => vi.unstubAllEnvs());

describe("robots canonical sitemap URL", () => {
  it("matches the configured site origin and retains private-route exclusions", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dadyoom.example/");
    const result = robots();

    expect(result.sitemap).toBe("https://dadyoom.example/sitemap.xml");
    expect(result.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
        disallow: expect.arrayContaining(["/api/", "/student/", "/teacher/", "/admin/"]),
      }),
    );
  });

  it("uses the same deployment URL fallback as page metadata", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "dadyoom-preview.example");

    expect(robots().sitemap).toBe("https://dadyoom-preview.example/sitemap.xml");
  });
});
