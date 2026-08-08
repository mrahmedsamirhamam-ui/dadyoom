import type { SupabaseClient } from "@supabase/supabase-js";

type SaveLessonChatParams = {
  supabase: SupabaseClient;
  studentId: string;
  lessonId: string;
  userMessage: string;
  assistantMessage: string;
};

export async function saveLessonChat({
  supabase,
  studentId,
  lessonId,
  userMessage,
  assistantMessage,
}: SaveLessonChatParams): Promise<void> {
  const rows = [
    {
      student_id: studentId,
      lesson_id: lessonId,
      role: "user",
      content: userMessage,
    },
    {
      student_id: studentId,
      lesson_id: lessonId,
      role: "assistant",
      content: assistantMessage,
    },
  ];

  const { error } =
    await supabase
      .from("lesson_chat_messages")
      .insert(rows);

  if (error) {
    throw error;
  }
}
