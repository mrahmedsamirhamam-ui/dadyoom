import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl, SITE_NAME, SITE_NAME_ALTERNATES, SITE_NAME_ARABIC_VARIANTS } from "@/lib/site";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Dadyoom Arabic discoverability", () => {
  it("keeps one official Arabic site name and a small, unique set of authentic aliases", () => {
    expect(SITE_NAME).toBe("ضاديوم");
    expect(SITE_NAME_ALTERNATES).toEqual([
      "Dadyoom",
      "ضاضيوم",
      "داديوم",
      "ضاديو",
      "Dadyoum",
      "dadyoom.com",
    ]);
    expect(new Set(SITE_NAME_ALTERNATES).size).toBe(SITE_NAME_ALTERNATES.length);
    expect(SITE_NAME_ARABIC_VARIANTS.every((variant) => SITE_NAME_ALTERNATES.includes(variant))).toBe(true);
    expect(SITE_NAME_ALTERNATES).not.toContain(SITE_NAME);
  });

  it("always publishes the live domain as canonical in production, never localhost", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL_URL", "preview.example.invalid");
    expect(getSiteUrl()).toBe("https://dadyoom.com");
  });

  it("sends a valid live sitemap address to crawlers", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const rules = robots();
    expect(rules.sitemap).toBe("https://dadyoom.com/sitemap.xml");
    expect(JSON.stringify(rules.rules)).toContain('"/"');
  });

  it("advertises the homepage and founder pages using the real domain", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const pages = await sitemap();
    const urls = pages.map((page) => page.url);
    expect(urls).toContain("https://dadyoom.com");
    expect(urls).toContain("https://dadyoom.com/about");
    expect(urls).toContain("https://dadyoom.com/founder");
    expect(urls.every((url) => url.startsWith("https://dadyoom.com"))).toBe(true);
  });
});
