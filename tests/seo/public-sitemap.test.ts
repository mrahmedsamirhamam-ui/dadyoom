import { afterEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  client: null as unknown,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mocked.client,
}));

import sitemap, { dynamic } from "@/app/sitemap";

type PublishedLesson = { id: string; updated_at: string | null };
type PublishedCourse = { slug: string; updated_at: string | null };

function stubDatabase(lessons: PublishedLesson[], courses: PublishedCourse[], fail = false) {
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
                      return { data: fail ? null : rows.slice(from, to + 1), error: fail ? { message: "private-database-error" } : null };
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
  vi.restoreAllMocks();
  mocked.client = null;
});

describe("generated public sitemap", () => {
  it("must run at request time rather than freeze URLs during Next build", () => {
    expect(dynamic).toBe("force-dynamic");
  });

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
    expect(queries).toHaveLength(12); // 2 course pages + 10 lesson pages (empty terminal reads).
    expect(queries.filter((query) => query.table === "edu_marketplace_courses")).toEqual(
      Array.from({ length: 2 }, () => ({
        table: "edu_marketplace_courses", field: "status", value: "published", order: "slug",
      })),
    );
    expect(queries.filter((query) => query.table === "lessons")).toEqual(
      Array.from({ length: 10 }, () => ({
        table: "lessons", field: "status", value: "published", order: "id",
      })),
    );
  });

  it("does not advertise a nine-URL sitemap when a configured database read fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dadyoom.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-db.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-test-only");
    stubDatabase([], [], true);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sitemap()).rejects.toThrow("SITEMAP_PUBLISHED_URLS_UNAVAILABLE");
    expect(errorLog).toHaveBeenCalledWith("SITEMAP_DYNAMIC_PAGINATION_UNAVAILABLE");
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
