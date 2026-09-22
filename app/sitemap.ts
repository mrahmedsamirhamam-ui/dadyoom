import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/skills`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/dictionary`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/marketplace`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/reading-challenge`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/ask`, changeFrequency: "monthly", priority: 0.65 },
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

  const [
    { data: courses, error: coursesError },
    { data: lessons, error: lessonsError },
  ] = await Promise.all([
    db
      .from("edu_marketplace_courses")
      .select("slug,updated_at")
      .eq("status", "published")
      .limit(5000),
    db
      .from("lessons")
      .select("id,updated_at")
      .eq("status", "published")
      .limit(5000),
  ]);

  if (coursesError) {
    console.error("SEO_SITEMAP_COURSES_FAILED", coursesError.message);
  }

  if (lessonsError) {
    console.error("SEO_SITEMAP_LESSONS_FAILED", lessonsError.message);
  }

  const marketplaceRoutes: MetadataRoute.Sitemap =
    !coursesError
      ? (courses ?? []).map((course) => ({
          url: `${base}/marketplace/${course.slug}`,
          lastModified: course.updated_at
            ? new Date(course.updated_at)
            : undefined,
          changeFrequency: "weekly",
          priority: 0.8,
        }))
      : [];

  const lessonRoutes: MetadataRoute.Sitemap =
    !lessonsError
      ? (lessons ?? []).map((lesson) => ({
          url: `${base}/lessons/${lesson.id}`,
          lastModified: lesson.updated_at
            ? new Date(lesson.updated_at)
            : undefined,
          changeFrequency: "monthly",
          priority: 0.7,
        }))
      : [];

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
