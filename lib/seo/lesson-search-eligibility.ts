import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side SEO eligibility. A published lesson is not automatically
 * indexable; the existing security-invoker database view rejects copied
 * boilerplate, duplicate content and other low-value pages.
 *
 * This is a read-only metadata check: do not return answer keys, user data
 * or browser-writable status. Fail closed for search crawlers if the view is
 * temporarily inaccessible, without hiding the lesson from its learners.
 */
export async function isLessonSearchEligible(
  db: SupabaseClient,
  lessonId: string,
): Promise<boolean> {
  if (!lessonId.trim()) return false;
  try {
    const { data, error } = await db
      .from("seo_indexable_lessons")
      .select("id")
      .eq("id", lessonId)
      .maybeSingle();
    if (error) {
      console.error("SEO_LESSON_ELIGIBILITY_READ_UNAVAILABLE");
      return false;
    }
    return data?.id === lessonId;
  } catch {
    console.error("SEO_LESSON_ELIGIBILITY_READ_UNAVAILABLE");
    return false;
  }
}
