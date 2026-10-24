import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Storage authorization is rechecked here, not assumed from server-action callers.
// An authenticated session may only create/update its own published lesson progress.
async function requireStudentSession() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("يجب تسجيل الدخول لحفظ تقدم الدرس.");
  }
  return { supabase, user };
}

export async function getLessonProgress(
  studentId: string,
  lessonId: string
) {
  const { supabase, user } = await requireStudentSession();
  if (user.id !== studentId) {
    throw new Error("غير مسموح بعرض تقدم طالب آخر.");
  }

  return supabase
    .from("student_lesson_progress")
    .select("*")
    .eq("student_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();
}

export async function createLessonProgress(
  data: { student_id: string; lesson_id: string }
) {
  const { supabase, user } = await requireStudentSession();
  if (data.student_id !== user.id) {
    throw new Error("غير مسموح بإنشاء تقدم لطالب آخر.");
  }

  // The student's RLS view must confirm the target lesson is published
  // before server-only persistence is permitted.
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", data.lesson_id)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError) throw lessonError;
  if (!lesson) {
    throw new Error("لا يمكن بدء درس غير منشور.");
  }

  const admin = createAdminClient();
  // Two simultaneous "start lesson" requests may both pass the earlier
  // owner-scoped existence check. PostgreSQL enforces UNIQUE(student_id,
  // lesson_id): DO NOTHING on conflict instead of resetting a saved score,
  // earned XP, or completion status. Never use mergeDuplicates=true here.
  const { data: inserted, error: insertError } = await admin
    .from("student_lesson_progress")
    .upsert({
      student_id: user.id,
      lesson_id: lesson.id,
      status: "in_progress",
      progress_percent: 0,
      attempts: 0,
      best_score: 0,
      last_score: 0,
      xp: 0,
      time_spent_seconds: 0,
      started_at: new Date().toISOString(),
    }, {
      onConflict: "student_id,lesson_id",
      ignoreDuplicates: true,
    })
    .select()
    .maybeSingle();

  if (insertError) {
    throw insertError;
  }
  if (inserted) {
    return { data: inserted, error: null };
  }

  // DO NOTHING indicates the trusted row already exists. Re-read through
  // the student's RLS; do not manufacture a fresh zero-progress response.
  const { data: existing, error: readError } = await supabase
    .from("student_lesson_progress")
    .select("*")
    .eq("student_id", user.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();
  if (readError) {
    throw readError;
  }
  if (!existing) {
    throw new Error("تعذر التحقق من سجل تقدم الدرس الحالي.");
  }
  return { data: existing, error: null };
}

export async function updateLessonProgress(
  id: string,
  values: Record<string, unknown>
) {
  const { supabase, user } = await requireStudentSession();

  // Authorize both ownership and the lesson attached to the stored record.
  const { data: progress, error: progressError } = await supabase
    .from("student_lesson_progress")
    .select("id,student_id,lesson_id")
    .eq("id", id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (progressError) throw progressError;
  if (!progress) {
    throw new Error("سجل تقدم الدرس غير متاح.");
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", progress.lesson_id)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError) throw lessonError;
  if (!lesson) {
    throw new Error("الدرس غير متاح لتحديث الإتقان.");
  }

  // Allow only canonical completion fields through this repository method.
  // Prevent accidental user-supplied identity or lesson reassignment.
  const permitted = new Set([
    "status", "progress_percent", "last_score", "best_score",
    "xp", "completed_at", "updated_at",
  ]);
  if (Object.keys(values).some((key) => !permitted.has(key))) {
    throw new Error("حقول تحديث تقدم الدرس غير مسموحة.");
  }

  const admin = createAdminClient();
  return admin
    .from("student_lesson_progress")
    .update(values)
    .eq("id", progress.id)
    .eq("student_id", user.id)
    .eq("lesson_id", lesson.id)
    .select()
    .single();
}
