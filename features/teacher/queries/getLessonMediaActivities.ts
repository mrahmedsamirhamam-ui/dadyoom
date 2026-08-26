
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LessonMediaActivity = {
  id: string;
  title: string;
  activityType: string;
  instructions: string | null;
  activityOrder: number;
  points: number;
  imageUrl: string | null;
  audioUrl: string | null;
  audioText: string | null;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function getLessonMediaActivities(lessonId: string): Promise<LessonMediaActivity[]> {
  const sessionClient = await createClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return [];

  const { data: profile } = await sessionClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const { data: lesson } = await sessionClient.from("lessons").select("id,created_by").eq("id", lessonId).maybeSingle();
  const role = profile?.role?.trim().toLowerCase() ?? "";

  if (!lesson || (role !== "admin" && !(role === "teacher" && lesson.created_by === user.id))) {
    return [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_activities")
    .select("id,title,activity_type,instructions,activity_order,points,content")
    .eq("lesson_id", lessonId)
    .order("activity_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const content = record(row.content);
    return {
      id: row.id,
      title: row.title,
      activityType: row.activity_type,
      instructions: row.instructions,
      activityOrder: row.activity_order,
      points: row.points,
      imageUrl: text(content.image_url),
      audioUrl: text(content.audio_url),
      audioText: text(content.audio_text),
    };
  });
}
