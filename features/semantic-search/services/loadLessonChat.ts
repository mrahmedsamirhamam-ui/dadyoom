import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  LessonChatMessage,
} from "../chat/LessonChatContext";

type Params = {
  supabase: SupabaseClient;
  studentId: string;
  lessonId: string;
};

type ChatRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export async function loadLessonChat({
  supabase,
  studentId,
  lessonId,
}: Params): Promise<LessonChatMessage[]> {
  const {
    data,
    error,
  } = await supabase
    .from("lesson_chat_messages")
    .select(
      "id,role,content,created_at"
    )
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .order("created_at", {
      ascending: false,
    })
    .limit(20);

  if (error) {
    throw new Error(
      `LOAD_LESSON_CHAT_FAILED: ${error.message}`
    );
  }

  return ((data ?? []) as ChatRow[])
    .reverse()
    .filter(
      (
        item
      ): item is ChatRow & {
        role: "user" | "assistant";
      } =>
        item.role === "user" ||
        item.role === "assistant"
    )
    .map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content,
      createdAt: item.created_at,
    }));
}
