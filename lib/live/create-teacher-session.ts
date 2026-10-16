import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { parseBahrainDateTimeLocal } from "@/lib/live/bahrain-datetime";

function value(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }

export async function createTeacherLiveSessionRecord(
  form: FormData,
) {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const title = value(form, "title");
  const startsAt = value(form, "startsAt");
  const endsAt = value(form, "endsAt");
  const courseId = value(form, "courseId");
  const classId = value(form, "classId");

  if (
    !title ||
    !startsAt ||
    (!courseId && !classId)
  ) {
    throw new Error("LIVE_SESSION_FIELDS_REQUIRED");
  }

  if (courseId) {
    const { data } = await supabase
      .from("edu_marketplace_courses")
      .select("id")
      .eq("id", courseId)
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (!data) {
      throw new Error("COURSE_NOT_OWNED_BY_TEACHER");
    }
  }

  if (classId) {
    const { data } = await supabase
      .from("teacher_classes")
      .select("id")
      .eq("id", classId)
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (!data) {
      throw new Error("CLASS_NOT_OWNED_BY_TEACHER");
    }
  }

  const starts = parseBahrainDateTimeLocal(startsAt);

  if (!starts) {
    throw new Error("INVALID_START_TIME");
  }

  const ends = endsAt
    ? parseBahrainDateTimeLocal(endsAt)
    : null;

  if (endsAt && (!ends || ends <= starts)) {
    throw new Error("INVALID_END_TIME");
  }

  const roomName =
    `dadyoom-${user.id.slice(0, 8)}-${crypto.randomUUID()}`;

  const { error } = await db
    .from("edu_live_sessions")
    .insert({
      teacher_id: user.id,
      course_id: courseId || null,
      class_id: classId || null,
      title,
      description: value(form, "description") || null,
      starts_at: starts.toISOString(),
      ends_at: ends?.toISOString() ?? null,
      room_name: roomName,
      status: "scheduled",
    });

  if (error) {
    throw new Error(error.message);
  }

}
