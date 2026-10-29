import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { learningGuides } from "@/content/learning-guides";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    { url: `${base}/guides`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/marketplace`, changeFrequency: "daily", priority: 0.9 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) return [...staticRoutes, ...learningGuides.map((guide) => ({ url: `${base}/guides/${guide.slug}`, changeFrequency: "monthly" as const, priority: 0.6 }))];

  const db = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: courses } = await db
    .from("edu_marketplace_courses")
    .select("slug,updated_at")
    .eq("status", "published")
    .limit(5000);

  // No silent first-5000 truncation: production currently exceeds 8000 published lessons.
  // Bound the fetch to 50 pages (50,000 rows) and use only public ID/timestamp fields.
  type LessonSitemapRow = { id: string; updated_at: string | null };
  const lessons: LessonSitemapRow[] = [];
  for (let page = 0; page < 50; page += 1) {
    const { data, error } = await db
      .from("lessons")
      .select("id,updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) {
      // Sitemap remains usable for already retrieved routes, but CI must flag DB errors.
      console.error("DADYOOM_SITEMAP_LESSONS_FETCH_FAILED", error.code);
      break;
    }
    if (!data?.length) break;
    lessons.push(...data);
    if (data.length < 1000) break;
  }

  return [
    ...staticRoutes,
    ...learningGuides.map((guide) => ({ url: `${base}/guides/${guide.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...(courses ?? []).map((course) => ({
      url: `${base}/marketplace/${course.slug}`,
      lastModified:
        course.updated_at
          ? new Date(course.updated_at)
          : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(lessons ?? []).map((lesson) => ({
      url: `${base}/lessons/${lesson.id}`,
      lastModified:
        lesson.updated_at
          ? new Date(lesson.updated_at)
          : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
