import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/founder`, changeFrequency: "monthly", priority: 0.7 },
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
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return staticRoutes;

  const db = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });


  // PostgREST commonly caps rows per request at 1,000. Without explicit
  // pagination, the former 5,000-row limit hid thousands of published lessons.
  const pageSize = 1000;
  const courses: Array<{ slug: string; updated_at: string | null }> = [];
  const lessons: Array<{ id: string; updated_at: string | null }> = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await db
      .from("edu_marketplace_courses")
      .select("slug,updated_at")
      .eq("status", "published")
      .order("slug", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Dadyoom sitemap course pagination failed:", error.message);
      break;
    }
    if (!data?.length) break;
    courses.push(...data);
    if (data.length < pageSize) break;
  }

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await db
      .from("lessons")
      .select("id,updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Dadyoom sitemap lesson pagination failed:", error.message);
      break;
    }
    if (!data?.length) break;
    lessons.push(...data);
    if (data.length < pageSize) break;
  }

  return [
    ...staticRoutes,
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
