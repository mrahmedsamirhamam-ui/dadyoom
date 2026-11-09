import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LessonReviewer = { id: string; name: string };

// A mutable profiles.role is never sufficient. Review privileges must be explicitly
// provisioned in server-managed Auth app_metadata by a trusted operator.
export async function getVerifiedLessonReviewer(): Promise<LessonReviewer | null> {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user || user.app_metadata?.dadyoom_lesson_reviewer !== true) return null;
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("role,full_name").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role?.trim().toLowerCase() !== "admin") return null;
  const name = typeof profile.full_name === "string" ? profile.full_name.trim() : "";
  if (!name) return null; // never invent reviewer names
  return { id: user.id, name };
}
