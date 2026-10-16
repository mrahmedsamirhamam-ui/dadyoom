import type { SupabaseClient } from "@supabase/supabase-js";

import TeacherClassroomClient from "./TeacherClassroomClient";

import { createClient } from "@/lib/supabase/server";

export default async function TeacherClassroomPage() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Keep SSR to the teacher's active classes and roster. Historical
  // conversations, rewards and the broad lesson dropdown are loaded by
  // the browser using the user's RLS credentials after the first paint.
  // This avoids nine RLS round-trips while rendering a Cloudflare Worker.
  const classesResult = await db
    .from("teacher_classes")
    .select("id,name,academic_year")
    .eq("teacher_id", user.id)
    .eq("is_active", true)
    .order("created_at")
    .limit(50);

  if (classesResult.error) {
    console.error("TEACHER_CLASSROOM_CLASSES_FAILED", classesResult.error.code);
    throw new Error("تعذر تحميل فصول المعلم.");
  }

  const classes = classesResult.data ?? [];
  const classIds = classes.map((item) => String(item.id));

  const { data: membershipData } = classIds.length
    ? await db
        .from("teacher_class_students")
        .select("class_id,student_id")
        .in("class_id", classIds)
        .eq("is_active", true)
        .limit(1000)
    : { data: [] };

  const memberships = membershipData ?? [];
  const studentIds = [
    ...new Set(memberships.map((item) => String(item.student_id))),
  ];

  const profileResult = studentIds.length
    ? await db
        .from("profiles")
        .select("id,full_name,email")
        .in("id", studentIds)
    : { data: [] };

  const profileById = new Map(
    (profileResult.data ?? []).map((item) => [String(item.id), item]),
  );

  const students = memberships.map((item) => {
    const profile = profileById.get(String(item.student_id));

    return {
      classId: String(item.class_id),
      id: String(item.student_id),
      name: String(profile?.full_name ?? profile?.email ?? "طالب"),
    };
  });

  return (
    <TeacherClassroomClient
      teacherId={user.id}
      classes={classes as Array<{ id: string; name: string; academic_year: string | null }>}
      students={students}
      lessons={[]}
      conversations={[]}
      messages={[]}
      assignments={[]}
      rewards={[]}
    />
  );
}
