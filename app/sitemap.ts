import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/courses`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/skills`,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${base}/dictionary`,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${base}/pricing`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/marketplace`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/reading-challenge`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/ask`,
      changeFrequency: "monthly",
      priority: 0.65,
    },
  ];

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    console.warn(
      "SEO_SITEMAP_DYNAMIC_LESSONS_DISABLED",
      {
        hasUrl: Boolean(url),
        hasServiceRole:
          Boolean(key),
      },
    );

    return staticRoutes;
  }

  const db = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

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
    console.error(
      "SEO_SITEMAP_COURSES_FAILED",
      coursesError.message,
    );
  }

  if (lessonsError) {
    console.error(
      "SEO_SITEMAP_LESSONS_FAILED",
      lessonsError.message,
    );
  }

  return [
    ...staticRoutes,
    ...(!coursesError
      ? (courses ?? []).map((course) => ({
          url: `${base}/marketplace/${course.slug}`,
          lastModified:
            course.updated_at
              ? new Date(course.updated_at)
              : undefined,
          changeFrequency:
            "weekly" as const,
          priority: 0.8,
        }))
      : []),
    ...(!lessonsError
      ? (lessons ?? []).map((lesson) => ({
          url: `${base}/lessons/${lesson.id}`,
          lastModified:
            lesson.updated_at
              ? new Date(lesson.updated_at)
              : undefined,
          changeFrequency:
            "monthly" as const,
          priority: 0.7,
        }))
      : []),
  ];
}
