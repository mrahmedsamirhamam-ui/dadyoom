"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function clearLessonTutor(
  lessonId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "يجب تسجيل الدخول."
    );
  }

  const { error } = await supabase
    .from("ai_tutor_messages")
    .delete()
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId);

  if (error) {
    throw error;
  }

  revalidatePath(
    `/lessons/${lessonId}`
  );
}
