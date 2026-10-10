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
  country_code: string;
  grade_number: number | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: "2026-10-10", changeFrequency: "weekly", priority: 1 },
    { url: `${base}/teachers`, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/curriculum`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/learn-arabic`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/en`, lastModified: "2026-10-10", changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/en/learn-arabic`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/en/curriculum`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/about`, lastModified: "2026-10-10", changeFrequency: "monthly", priority: 0.7 },
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
        .select("id,slug,updated_at,country_code,grade_number")
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

  const gradeRouteMap = new Map<
    string,
    string | null
  >();

  for (const lesson of lessons) {
    const gradeNumber = Number(
      lesson.grade_number,
    );

    if (
      !lesson.country_code ||
      !Number.isInteger(gradeNumber) ||
      gradeNumber < 1 ||
      gradeNumber > 13
    ) {
      continue;
    }

    const key =
      `${lesson.country_code.toLowerCase()}/${gradeNumber}`;

    const current =
      gradeRouteMap.get(key) ?? null;

    if (
      lesson.updated_at &&
      (!current ||
        lesson.updated_at > current)
    ) {
      gradeRouteMap.set(
        key,
        lesson.updated_at,
      );
    } else if (
      !gradeRouteMap.has(key)
    ) {
      gradeRouteMap.set(key, null);
    }
  }

  const gradeDirectoryRoutes: MetadataRoute.Sitemap =
    [...gradeRouteMap.entries()].map(
      ([key, updatedAt]) => ({
        url: `${base}/curriculum/${key}`,
        lastModified: updatedAt
          ? new Date(updatedAt)
          : undefined,
        changeFrequency: "weekly",
        priority: 0.82,
      }),
    );

  console.info("SEO_SITEMAP_READY", {
    staticRoutes: staticRoutes.length,
    marketplaceRoutes: marketplaceRoutes.length,
    countryDirectoryRoutes: countryDirectoryRoutes.length,
    gradeDirectoryRoutes: gradeDirectoryRoutes.length,
    lessonRoutes: lessonRoutes.length,
    total:
      staticRoutes.length +
      countryDirectoryRoutes.length +
      gradeDirectoryRoutes.length +
      marketplaceRoutes.length +
      lessonRoutes.length,
  });

  return [
    ...staticRoutes,
    ...countryDirectoryRoutes,
    ...gradeDirectoryRoutes,
    ...marketplaceRoutes,
    ...lessonRoutes,
  ];
}
