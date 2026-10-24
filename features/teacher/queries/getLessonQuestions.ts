import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LessonQuestionOption = {
  id: string;
  text: string;
};

export type LessonQuestionForEditor = {
  id: string;
  lesson_id: string;
  question_order: number;
  question: string;
  question_type: string;
  options: LessonQuestionOption[];
  correct_answer: string;
  explanation: string | null;
  points: number;
};

function normalizeOptions(
  value: unknown
): LessonQuestionOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const options: LessonQuestionOption[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      continue;
    }

    const record =
      item as Record<string, unknown>;

    const id =
      typeof record.id === "string"
        ? record.id
        : "";

    const text =
      typeof record.text === "string"
        ? record.text
        : "";

    if (!id) {
      continue;
    }

    options.push({
      id,
      text,
    });
  }

  return options;
}

export async function getLessonQuestions(
  lessonId: string
): Promise<LessonQuestionForEditor[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("يجب تسجيل الدخول لقراءة مفاتيح أسئلة المعلم.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("تعذر التحقق من صلاحية تحرير الأسئلة.");
  }

  const role = profile.role?.trim().toLowerCase() ?? "";
  if (role !== "admin" && role !== "teacher") {
    throw new Error("غير مصرح بعرض مفاتيح إجابات الأسئلة.");
  }

  // Use the authenticated/RLS-bound client to authorize the lesson BEFORE
  // creating a privileged client; a teacher may read only owned lessons.
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id,created_by")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson ||
      (role === "teacher" && lesson.created_by !== user.id)) {
    throw new Error("الدرس غير متاح لهذا المعلم.");
  }

  // Server-only read preserves legitimate teacher editing after a staged
  // migration removes browser SELECT on questions.correct_answer.
  const admin = createAdminClient();

  const {
    data,
    error,
  } = await admin
    .from("questions")
    .select(
      "id, lesson_id, question_order, question, question_type, options, correct_answer, explanation, points"
    )
    .eq(
      "lesson_id",
      lessonId
    )
    .order(
      "question_order",
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (row) => ({
      id: row.id,
      lesson_id: row.lesson_id,
      question_order:
        row.question_order,
      question:
        row.question,
      question_type:
        row.question_type,
      options:
        normalizeOptions(
          row.options
        ),
      correct_answer:
        row.correct_answer,
      explanation:
        row.explanation,
      points:
        row.points,
    })
  );
}
