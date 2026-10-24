import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";
import { collectSitemapRows } from "@/lib/seo/sitemap-pagination";

// Next.js metadata sitemaps are static by default. Database-backed lesson
// URLs must be resolved at request time (e.g. build env may not contain the
// server-only key); never freeze a nine-route placeholder into build output.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use the same canonical origin as the page metadata/structured data.
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/courses/arabic-from-zero`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/courses/rooms`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/courses/rooms/native-arabic`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/courses/rooms/non-native`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/courses/video-library`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/marketplace`, changeFrequency: "daily", priority: 0.9 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) return staticRoutes;

  const db = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    // Use the existing, security-invoker, public-metadata-only
    // seo_indexable_lessons view, NOT all published rows. Publication does
    // not certify helpful, unique content: this view already excludes
    // title/TOC boilerplate, duplicates, placeholder books, inactive scopes
    // and other low-value pages. It currently exposes 2,154 eligible URLs
    // from 8,307 published rows (read-only audit 2026-10-24).
    // Stable pagination ensures all eligible URLs appear, even above 5,000.
    const [courses, lessons] = await Promise.all([
      collectSitemapRows(async (from, to) =>
        db
          .from("edu_marketplace_courses")
          .select("slug,updated_at")
          .eq("status", "published")
          .order("slug", { ascending: true })
          .range(from, to),
      ),
      collectSitemapRows(async (from, to) =>
        db
          .from("seo_indexable_lessons")
          .select("id,updated_at")
          .order("id", { ascending: true })
          .range(from, to),
      ),
    ]);

    const dynamicRoutes: MetadataRoute.Sitemap = [
      ...courses.map((course) => ({
        url: `${base}/marketplace/${course.slug}`,
        lastModified: course.updated_at
          ? new Date(course.updated_at)
          : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...lessons.map((lesson) => ({
        url: `${base}/lessons/${lesson.id}`,
        lastModified: lesson.updated_at
          ? new Date(lesson.updated_at)
          : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];

    const seen = new Set(staticRoutes.map((route) => route.url));
    return [
      ...staticRoutes,
      ...dynamicRoutes.filter((route) => {
        if (seen.has(route.url)) return false;
        seen.add(route.url);
        return true;
      }),
    ];
  } catch {
    // Never return HTTP 200 with only nine links after a transient read error:
    // crawlers would mistake missing published lessons for intentional removal.
    // Let the metadata handler return an error so the crawler can retry.
    // No backend error details or secrets enter the HTTP response.
    console.error("SITEMAP_DYNAMIC_PAGINATION_UNAVAILABLE");
    throw new Error("SITEMAP_PUBLISHED_URLS_UNAVAILABLE");
  }
}
