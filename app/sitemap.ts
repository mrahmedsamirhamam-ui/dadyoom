
import type { MetadataRoute } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

type PublishedLesson = {
  id: string;
  updated_at: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const publicRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/courses`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/skills`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/dictionary`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/ask`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !anonKey) {
    return publicRoutes;
  }

  try {
    const supabase = createSupabaseClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("lessons")
      .select("id,updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.warn("SITEMAP_LESSONS_WARNING:", error.message);
      return publicRoutes;
    }

    const lessons = (data ?? []) as PublishedLesson[];

    return [
      ...publicRoutes,
      ...lessons.map((lesson) => ({
        url: `${siteUrl}/lessons/${lesson.id}`,
        lastModified: lesson.updated_at ? new Date(lesson.updated_at) : now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.warn("SITEMAP_BUILD_WARNING:", error);
    return publicRoutes;
  }
}
