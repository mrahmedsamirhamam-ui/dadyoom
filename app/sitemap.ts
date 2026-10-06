import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

import { ARAB_COUNTRY_CODES } from "@/lib/countries";
import { getSiteUrl } from "@/lib/site";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

export const revalidate = 3600;

type MarketplaceRow = {
  slug: string;
  updated_at: string | null;
};

type LessonRow = {
  id: string;
  slug: string | null;
  updated_at: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/curriculum`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/learn-arabic`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/courses/arabic-from-zero`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/courses/rooms`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/courses/video-library`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/refund-policy`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/marketplace`, changeFrequency: "daily", priority: 0.9 },
  ];

  const countryDirectoryRoutes: MetadataRoute.Sitemap =
    ARAB_COUNTRY_CODES.map((code) => ({
      url: `${base}/curriculum/${code.toLowerCase()}`,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  const db = createClient(
    SUPABASE_PUBLIC_URL,
    SUPABASE_PUBLIC_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  async function fetchPublishedMarketplace(): Promise<MarketplaceRow[]> {
    const rows: MarketplaceRow[] = [];
    const pageSize = 1000;

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await db
        .from("edu_marketplace_courses")
        .select("slug,updated_at")
        .eq("status", "published")
        .not("slug", "like", "e2e-%")
        .order("slug", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error(
          "SEO_SITEMAP_COURSES_FAILED",
          error.message,
        );
        throw new Error(
          `SEO_SITEMAP_COURSES_FAILED:${error.message}`,
        );
      }

      const batch =
        (data ?? []) as MarketplaceRow[];

      rows.push(...batch);

      if (batch.length < pageSize) {
        break;
      }
    }

    return rows;
  }

  async function fetchIndexableLessons(): Promise<LessonRow[]> {
    const rows: LessonRow[] = [];
    const pageSize = 1000;

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await db
        .from("seo_indexable_lessons_fast")
        .select("id,slug,updated_at")
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error(
          "SEO_SITEMAP_LESSONS_FAILED",
          error.message,
        );
        throw new Error(
          `SEO_SITEMAP_LESSONS_FAILED:${error.message}`,
        );
      }

      const batch =
        (data ?? []) as LessonRow[];

      rows.push(...batch);

      if (batch.length < pageSize) {
        break;
      }
    }

    return rows;
  }

  const [courses, lessons] =
    await Promise.all([
      fetchPublishedMarketplace(),
      fetchIndexableLessons(),
    ]);

  const marketplaceRoutes: MetadataRoute.Sitemap =
    courses.map((course) => ({
      url: `${base}/marketplace/${course.slug}`,
      lastModified: course.updated_at
        ? new Date(course.updated_at)
        : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const lessonRoutes: MetadataRoute.Sitemap =
    lessons.map((lesson) => ({
      url: `${base}/lessons/${lesson.id}`,
      lastModified: lesson.updated_at
        ? new Date(lesson.updated_at)
        : undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  console.info("SEO_SITEMAP_READY", {
    staticRoutes: staticRoutes.length,
    marketplaceRoutes: marketplaceRoutes.length,
    countryDirectoryRoutes: countryDirectoryRoutes.length,
    lessonRoutes: lessonRoutes.length,
    total:
      staticRoutes.length +
      countryDirectoryRoutes.length +
      marketplaceRoutes.length +
      lessonRoutes.length,
  });

  return [
    ...staticRoutes,
    ...countryDirectoryRoutes,
    ...marketplaceRoutes,
    ...lessonRoutes,
  ];
}
