import { createClient } from "@/lib/supabase/server";

export type TutorMessage = {
  id: string;
  role: "student" | "tutor";
  content: string;
  created_at: string;
};

type ServerSupabaseClient =
  Awaited<
    ReturnType<typeof createClient>
  >;

export async function getLessonTutorMessages(
  lessonId: string,
  userId?: string,
  existingSupabase?: ServerSupabaseClient
): Promise<TutorMessage[]> {
  const supabase =
    existingSupabase ??
    (await createClient());

  let resolvedUserId =
    userId;

  if (!resolvedUserId) {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    resolvedUserId =
      user.id;
  }

  const { data, error } =
    await supabase
      .from("ai_tutor_messages")
      .select(`
        id,
        role,
        content,
        created_at
      `)
      .eq(
        "user_id",
        resolvedUserId
      )
      .eq(
        "lesson_id",
        lessonId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      )
      .limit(50);

  if (error) {
    console.error(
      "Failed to load tutor messages:",
      error
    );

    return [];
  }

  return (
    data ?? []
  ) as TutorMessage[];
}
