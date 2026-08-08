import { createClient } from "@/lib/supabase/server";

export async function getLessonProgress(
  lessonId: string
) {
  const supabase =
    await createClient();


  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();


  const studentId =
    claimsData?.claims?.sub;

  if (
    claimsError ||
    !studentId
  ) {
    return {
      user: null,
      completed: false,
    };
  }


  const { data } =
    await supabase
      .from("lesson_progress")
      .select("completed")
      .eq(
        "user_id",
        studentId
      )
      .eq(
        "lesson_id",
        lessonId
      )
      .maybeSingle();


  return {
    user: {
      id: studentId,
    },
    completed:
      data?.completed ?? false,
  };
}
