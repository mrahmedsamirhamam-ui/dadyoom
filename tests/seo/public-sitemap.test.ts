import { afterEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mocked.client,
}));

import sitemap, { dynamic } from "@/app/sitemap";

type EligibleLesson = { id: string; updated_at: string | null };
type PublishedCourse = { slug: string; updated_at: string | null };
type QueryTrace = {
  table: string;
  field: string | null;
  value: string | null;
  order: string;
};

function stubDatabase(
  eligibleLessons: EligibleLesson[],
  courses: PublishedCourse[],
  fail = false,
) {
  const queries: QueryTrace[] = [];

  mocked.client = {
    from(table: string) {
      if (!["seo_indexable_lessons", "edu_marketplace_courses"].includes(table)) {
        throw new Error("Sitemap must not enumerate raw published lesson rows: " + table);
      }
      const rows = table === "seo_indexable_lessons" ? eligibleLessons : courses;
      let field: string | null = null;
      let value: string | null = null;
      const builder = {
        eq(column: string, equals: string) {
          field = column;
          value = equals;
          return builder;
        },
        order(column: string) {
          queries.push({ table, field, value, order: column });
          return {
            async range(from: number, to: number) {
              return {
                data: fail ? null : rows.slice(from, to + 1),
                error: fail ? { message: "private-database-error" } : null,
              };
            },
          };
        },
      };
      return { select: () => builder };
    },
  };
  return queries;
}

function enableFakeServer() {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dadyoom.example/");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-db.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-test-only");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  mocked.client = null;
});

describe("quality-aware generated public sitemap", () => {
  it("is generated at request time rather than frozen at build time", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("lists all curated eligible lessons, never every merely published lesson", async () => {
    enableFakeServer();

    // Read-only production observation 2026-10-24:
    // 8,307 published vs 2,154 eligible in seo_indexable_lessons.
    const eligible = Array.from({ length: 2154 }, (_, i) => ({
      id: `indexable-${i + 1}`,
      updated_at: "2026-10-24T00:00:00.000Z",
    }));
    const queries = stubDatabase(eligible, [
      { slug: "reading-course", updated_at: null },
    ]);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    const lessonUrls = urls.filter((url) => url.includes("/lessons/"));

    expect(lessonUrls).toHaveLength(2154);
    expect(urls).toContain("https://dadyoom.example/lessons/indexable-2154");
    expect(urls).toContain("https://dadyoom.example/marketplace/reading-course");
    expect(urls).not.toContain("https://dadyoom.example/lessons/draft-unpublished");
    expect(urls).not.toContain("https://dadyoom.example/lessons/published-but-unindexable");
    expect(new Set(urls).size).toBe(urls.length);
    expect(queries).toHaveLength(6); // 2 course reads + 4 eligible-lesson pages incl. empty.
    expect(queries.filter((q) => q.table === "edu_marketplace_courses")).toEqual(
      Array.from({ length: 2 }, () => ({
        table: "edu_marketplace_courses", field: "status", value: "published", order: "slug",
      })),
    );
    expect(queries.filter((q) => q.table === "seo_indexable_lessons")).toEqual(
      Array.from({ length: 4 }, () => ({
        table: "seo_indexable_lessons", field: null, value: null, order: "id",
      })),
    );
  });

  it("continues past a 5,000-row ceiling if the vetted list grows", async () => {
    enableFakeServer();
    const approved = Array.from({ length: 6001 }, (_, i) => ({
      id: `approved-${i + 1}`, updated_at: null,
    }));
    const queries = stubDatabase(approved, []);
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.filter((url) => url.includes("/lessons/"))).toHaveLength(6001);
    expect(urls).toContain("https://dadyoom.example/lessons/approved-6001");
    expect(queries.filter((q) => q.table === "seo_indexable_lessons")).toHaveLength(8);
  });

  it("does not advertise an incomplete 200 sitemap after a DB failure", async () => {
    enableFakeServer();
    stubDatabase([], [], true);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(sitemap()).rejects.toThrow("SITEMAP_PUBLISHED_URLS_UNAVAILABLE");
    expect(errorLog).toHaveBeenCalledWith("SITEMAP_DYNAMIC_PAGINATION_UNAVAILABLE");
  });

  it("returns public static routes only if server secrets are not configured", async () => {
    enableFakeServer();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const entries = await sitemap();
    expect(entries).toHaveLength(9);
    expect(entries[0]?.url).toBe("https://dadyoom.example");
  });
});
