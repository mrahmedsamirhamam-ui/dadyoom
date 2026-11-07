import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function GET() {
  const access = await requireRole(["TEACHER"]);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.reason },
      { status: access.reason === "unauthenticated" ? 401 : access.reason === "unavailable" ? 503 : 403 },
    );
  }

  const supabase = await createClient();
  const { data: classes, error: classesError } = await supabase
    .from("teacher_classes")
    .select("id")
    .eq("teacher_id", access.userId)
    .eq("is_active", true);
  if (classesError) return NextResponse.json({ error: "Unable to load classes" }, { status: 503 });

  const classIds = (classes ?? []).map((item) => item.id);
  if (!classIds.length) return NextResponse.json({ students: [] });

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("teacher_class_students")
    .select("student_id")
    .in("class_id", classIds)
    .eq("is_active", true);
  if (enrollmentError) return NextResponse.json({ error: "Unable to load students" }, { status: 503 });

  const studentIds = [...new Set((enrollments ?? []).map((item) => item.student_id))];
  if (!studentIds.length) return NextResponse.json({ students: [] });

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, grade_number")
    .in("id", studentIds);
  if (profileError) return NextResponse.json({ error: "Unable to load students" }, { status: 503 });

  // RLS may hide linked profiles. Never present a partial roster as complete.
  if ((profiles ?? []).length !== studentIds.length) {
    return NextResponse.json({ error: "Linked profile access is incomplete" }, { status: 503 });
  }

  return NextResponse.json({
    students: (profiles ?? []).map((profile) => ({
      id: profile.id,
      name: profile.full_name,
      grade: profile.grade_number,
    })),
  });
}
