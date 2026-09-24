import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

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
  updated_at: string | null;
};

async function fetchPublishedMarketplace(
  db: ReturnType<typeof createClient>,
): Promise<MarketplaceRow[]> {
  const rows: MarketplaceRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("edu_marketplace_courses")
      .select("slug,updated_at")
      .eq("status", "published")
      .order("slug", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(
        "SEO_SITEMAP_COURSES_FAILED",
        error.message,
      );
      break;
    }

    const batch = (data ?? []) as MarketplaceRow[];
    rows.push(...batch);

    if (batch.length < pageSize) break;
  }

  return rows;
}

async function fetchPublishedLessons(
  db: ReturnType<typeof createClient>,
): Promise<LessonRow[]> {
  const rows: LessonRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("lessons")
      .select("id,updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(
        "SEO_SITEMAP_LESSONS_FAILED",
        error.message,
      );
      break;
    }

    const batch = (data ?? []) as LessonRow[];
    rows.push(...batch);

    if (batch.length < pageSize) break;
  }

  return rows;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/marketplace`, changeFrequency: "daily", priority: 0.9 },
  ];

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

  const [courses, lessons] =
    await Promise.all([
      fetchPublishedMarketplace(db),
      fetchPublishedLessons(db),
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
    lessonRoutes: lessonRoutes.length,
    total:
      staticRoutes.length +
      marketplaceRoutes.length +
      lessonRoutes.length,
  });

  return [
    ...staticRoutes,
    ...marketplaceRoutes,
    ...lessonRoutes,
  ];
}
