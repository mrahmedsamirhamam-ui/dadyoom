import { afterEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  client: null as unknown,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mocked.client,
}));

import sitemap from "@/app/sitemap";

type PublishedLesson = { id: string; updated_at: string | null };
type PublishedCourse = { slug: string; updated_at: string | null };

function stubDatabase(lessons: PublishedLesson[], courses: PublishedCourse[]) {
  const queries: Array<{ table: string; field: string; value: string; order: string }> = [];

  mocked.client = {
    from(table: string) {
      const rows = table === "lessons" ? lessons : courses;
      return {
        select() {
          return {
            eq(field: string, value: string) {
              return {
                order(column: string) {
                  queries.push({ table, field, value, order: column });
                  return {
                    async range(from: number, to: number) {
                      return { data: rows.slice(from, to + 1), error: null };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  return queries;
}

afterEach(() => {
  vi.unstubAllEnvs();
  mocked.client = null;
});

describe("generated public sitemap", () => {
  it("includes every published lesson URL and no draft URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dadyoom.example/");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-db.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-test-only");

    const published = Array.from({ length: 8307 }, (_, i) => ({
      id: `published-${i + 1}`,
      updated_at: "2026-10-24T00:00:00.000Z",
    }));
    const queries = stubDatabase(published, [
      { slug: "reading-course", updated_at: null },
    ]);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    const lessonUrls = urls.filter((url) => url.includes("/lessons/"));

    expect(lessonUrls).toHaveLength(8307);
    expect(urls).toContain("https://dadyoom.example/lessons/published-8307");
    expect(urls).toContain("https://dadyoom.example/marketplace/reading-course");
    expect(urls).not.toContain("https://dadyoom.example/lessons/draft-unpublished");
    expect(new Set(urls).size).toBe(urls.length);
    expect(queries).toEqual([
      { table: "edu_marketplace_courses", field: "status", value: "published", order: "slug" },
      { table: "lessons", field: "status", value: "published", order: "id" },
    ]);
  });

  it("returns static public routes only when a server-only key is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dadyoom.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-db.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const result = await sitemap();
    expect(result).toHaveLength(9);
    expect(result[0]?.url).toBe("https://dadyoom.example");
  });
});
