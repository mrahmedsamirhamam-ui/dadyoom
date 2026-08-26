"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient =
  Awaited<
    ReturnType<
      typeof createClient
    >
  >;

type QuestionOption = {
  id: string;
  text: string;
};

type RpcError = {
  message: string;
};

type SafeRpcClient = {
  rpc: (
    functionName: string,
    args: Record<
      string,
      unknown
    >
  ) => Promise<{
    error: RpcError | null;
  }>;
};

function getString(
  formData: FormData,
  name: string
) {
  const value =
    formData.get(name);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function revalidateQuestions(
  lessonId: string
) {
  revalidatePath(
    "/teacher/" +
      lessonId
  );

  revalidatePath(
    "/lessons/" +
      lessonId
  );

  revalidatePath(
    "/teacher"
  );
}

async function requireLessonAccess(
  supabase: ServerSupabaseClient,
  lessonId: string
) {
  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !user
  ) {
    throw new Error(
      "\u064a\u062c\u0628 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648\u0644\u0627."
    );
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (
    profileError ||
    !profile
  ) {
    throw new Error(
      "\u062a\u0639\u0630\u0631 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628."
    );
  }

  const role =
    profile.role
      ?.trim()
      .toLowerCase() ??
    "";

  if (
    role !== "admin" &&
    role !== "teacher"
  ) {
    throw new Error(
      "\u063a\u064a\u0631 \u0645\u0635\u0631\u062d \u0644\u0643 \u0628\u0625\u062f\u0627\u0631\u0629 \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u062f\u0631\u0633."
    );
  }

  const {
    data: lesson,
    error: lessonError,
  } =
    await supabase
      .from("lessons")
      .select(
        "id, created_by"
      )
      .eq(
        "id",
        lessonId
      )
      .maybeSingle();

  if (
    lessonError ||
    !lesson
  ) {
    throw new Error(
      "\u062a\u0639\u0630\u0631 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062f\u0631\u0633."
    );
  }

  if (
    role === "teacher" &&
    lesson.created_by !==
      user.id
  ) {
    throw new Error(
      "\u0644\u0627 \u064a\u0645\u0643\u0646\u0643 \u062a\u0639\u062f\u064a\u0644 \u0623\u0633\u0626\u0644\u0629 \u062f\u0631\u0633 \u064a\u062e\u0635 \u0645\u0639\u0644\u0645\u0627 \u0622\u062e\u0631."
    );
  }
}

function readOptions(
  formData: FormData
): QuestionOption[] {
  const rawCount =
    getString(
      formData,
      "option_count"
    );

  const count =
    Number(rawCount);

  if (
    !Number.isInteger(
      count
    ) ||
    count < 2 ||
    count > 50
  ) {
    throw new Error(
      "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a \u063a\u064a\u0631 \u0635\u0627\u0644\u062d\u0629."
    );
  }

  const options:
    QuestionOption[] = [];

  const ids =
    new Set<string>();

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const id =
      getString(
        formData,
        "option_id_" +
          index
      );

    const text =
      getString(
        formData,
        "option_text_" +
          index
      );

    if (
      !id ||
      !text
    ) {
      throw new Error(
        "\u0643\u0644 \u062e\u064a\u0627\u0631 \u064a\u062c\u0628 \u0623\u0646 \u064a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u0645\u0639\u0631\u0641 \u0648\u0646\u0635."
      );
    }

    if (
      ids.has(id)
    ) {
      throw new Error(
        "\u0645\u0639\u0631\u0641\u0627\u062a \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a \u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0641\u0631\u064a\u062f\u0629."
      );
    }

    ids.add(id);

    options.push({
      id,
      text,
    });
  }

  return options;
}

function readQuestionPayload(
  formData: FormData
) {
  const question =
    getString(
      formData,
      "question"
    );

  const questionType =
    getString(
      formData,
      "question_type"
    );

  const correctAnswer =
    getString(
      formData,
      "correct_answer"
    );

  const explanation =
    getString(
      formData,
      "explanation"
    );

  const points =
    Number(
      getString(
        formData,
        "points"
      )
    );

  if (!question) {
    throw new Error(
      "\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0645\u0637\u0644\u0648\u0628."
    );
  }

  /*
   * V1 intentionally edits the
   * real multiple_choice contract
   * already used by the lesson.
   */
  if (
    questionType !==
    "multiple_choice"
  ) {
    throw new Error(
      "\u0647\u0630\u0647 \u0627\u0644\u0646\u0633\u062e\u0629 \u062a\u062f\u0639\u0645 \u062d\u0627\u0644\u064a\u0627 \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0646 \u0645\u062a\u0639\u062f\u062f \u0641\u0642\u0637."
    );
  }

  if (
    !Number.isInteger(
      points
    ) ||
    points <= 0
  ) {
    throw new Error(
      "\u062f\u0631\u062c\u0629 \u0627\u0644\u0633\u0624\u0627\u0644 \u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0639\u062f\u062f\u0627 \u0635\u062d\u064a\u062d\u0627 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631."
    );
  }

  const options =
    readOptions(
      formData
    );

  if (
    !options.some(
      (option) =>
        option.id ===
        correctAnswer
    )
  ) {
    throw new Error(
      "\u0627\u0644\u0625\u062c\u0627\u0628\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629 \u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0623\u062d\u062f \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a."
    );
  }

  return {
    question,
    questionType,
    options,
    correctAnswer,
    explanation:
      explanation || null,
    points,
  };
}

async function requireQuestionInLesson(
  supabase:
    ServerSupabaseClient,
  questionId: string,
  lessonId: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from("questions")
      .select(
        "id, lesson_id"
      )
      .eq(
        "id",
        questionId
      )
      .eq(
        "lesson_id",
        lessonId
      )
      .maybeSingle();

  if (
    error ||
    !data
  ) {
    throw new Error(
      "\u062a\u0639\u0630\u0631 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0633\u0624\u0627\u0644 \u062f\u0627\u062e\u0644 \u0647\u0630\u0627 \u0627\u0644\u062f\u0631\u0633."
    );
  }
}

export async function createLessonQuestion(
  formData: FormData
) {
  const lessonId =
    getString(
      formData,
      "lesson_id"
    );

  if (!lessonId) {
    throw new Error(
      "\u0645\u0639\u0631\u0641 \u0627\u0644\u062f\u0631\u0633 \u0645\u0637\u0644\u0648\u0628."
    );
  }

  const payload =
    readQuestionPayload(
      formData
    );

  const supabase =
    await createClient();

  await requireLessonAccess(
    supabase,
    lessonId
  );

  const {
    data: lastQuestion,
    error: orderError,
  } =
    await supabase
      .from("questions")
      .select(
        "question_order"
      )
      .eq(
        "lesson_id",
        lessonId
      )
      .order(
        "question_order",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

  if (orderError) {
    throw orderError;
  }

  const nextOrder =
    (
      lastQuestion
        ?.question_order ??
      0
    ) + 1;

  const { error } =
    await supabase
      .from("questions")
      .insert({
        lesson_id:
          lessonId,
        question_order:
          nextOrder,
        question:
          payload.question,
        question_type:
          payload.questionType,
        options:
          payload.options,
        correct_answer:
          payload.correctAnswer,
        explanation:
          payload.explanation,
        points:
          payload.points,
      });

  if (error) {
    throw error;
  }

  revalidateQuestions(
    lessonId
  );
}

export async function updateLessonQuestion(
  formData: FormData
) {
  const lessonId =
    getString(
      formData,
      "lesson_id"
    );

  const questionId =
    getString(
      formData,
      "question_id"
    );

  if (
    !lessonId ||
    !questionId
  ) {
    throw new Error(
      "\u0645\u0639\u0631\u0641 \u0627\u0644\u062f\u0631\u0633 \u0648\u0627\u0644\u0633\u0624\u0627\u0644 \u0645\u0637\u0644\u0648\u0628\u0627\u0646."
    );
  }

  const payload =
    readQuestionPayload(
      formData
    );

  const supabase =
    await createClient();

  await requireLessonAccess(
    supabase,
    lessonId
  );

  await requireQuestionInLesson(
    supabase,
    questionId,
    lessonId
  );

  /*
   * id, lesson_id and question_order
   * are deliberately preserved.
   */
  const { error } =
    await supabase
      .from("questions")
      .update({
        question:
          payload.question,
        question_type:
          payload.questionType,
        options:
          payload.options,
        correct_answer:
          payload.correctAnswer,
        explanation:
          payload.explanation,
        points:
          payload.points,
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        questionId
      )
      .eq(
        "lesson_id",
        lessonId
      );

  if (error) {
    throw error;
  }

  revalidateQuestions(
    lessonId
  );
}

export async function moveLessonQuestion(
  formData: FormData
) {
  const lessonId =
    getString(
      formData,
      "lesson_id"
    );

  const questionId =
    getString(
      formData,
      "question_id"
    );

  const direction =
    Number(
      getString(
        formData,
        "direction"
      )
    );

  if (
    !lessonId ||
    !questionId
  ) {
    throw new Error(
      "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0633\u0624\u0627\u0644 \u0646\u0627\u0642\u0635\u0629."
    );
  }

  if (
    direction !== -1 &&
    direction !== 1
  ) {
    throw new Error(
      "\u0627\u062a\u062c\u0627\u0647 \u0627\u0644\u062a\u062d\u0631\u064a\u0643 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d."
    );
  }

  const supabase =
    await createClient();

  await requireLessonAccess(
    supabase,
    lessonId
  );

  await requireQuestionInLesson(
    supabase,
    questionId,
    lessonId
  );

  const rpcClient =
    supabase as unknown as SafeRpcClient;

  const { error } =
    await rpcClient.rpc(
      "move_lesson_question_safe",
      {
        p_question_id:
          questionId,
        p_direction:
          direction,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  revalidateQuestions(
    lessonId
  );
}

export async function deleteLessonQuestion(
  formData: FormData
) {
  const lessonId =
    getString(
      formData,
      "lesson_id"
    );

  const questionId =
    getString(
      formData,
      "question_id"
    );

  if (
    !lessonId ||
    !questionId
  ) {
    throw new Error(
      "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0633\u0624\u0627\u0644 \u0646\u0627\u0642\u0635\u0629."
    );
  }

  const supabase =
    await createClient();

  await requireLessonAccess(
    supabase,
    lessonId
  );

  await requireQuestionInLesson(
    supabase,
    questionId,
    lessonId
  );

  const rpcClient =
    supabase as unknown as SafeRpcClient;

  const { error } =
    await rpcClient.rpc(
      "delete_lesson_question_safe",
      {
        p_question_id:
          questionId,
      }
    );

  if (error) {
    if (
      error.message.includes(
        "QUESTION_HAS_DEPENDENCIES"
      )
    ) {
      throw new Error(
        "\u0644\u0627 \u064a\u0645\u0643\u0646 \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0633\u0624\u0627\u0644 \u0644\u0623\u0646\u0647 \u0645\u0631\u062a\u0628\u0637 \u0628\u0645\u062d\u0627\u0648\u0644\u0627\u062a \u0637\u0644\u0627\u0628 \u0623\u0648 \u0645\u0647\u0627\u0631\u0627\u062a."
      );
    }

    throw new Error(
      error.message
    );
  }

  revalidateQuestions(
    lessonId
  );
}
