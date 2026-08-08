import { invalidateStudentCaches } from "@/features/student-progress/services/invalidate-student-caches";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {

  const { lessonId } = await request.json();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const { error } = await supabase
    .from("student_progress")
    .insert([
      {
        student_email: user.email,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
    // STUDENT_CACHE_INVALIDATION_POINT
    await invalidateStudentCaches({
      studentId: user.id,
      studentEmail: user.email,
      supabase,
    });

  return NextResponse.json({
    success: true,
  });
}