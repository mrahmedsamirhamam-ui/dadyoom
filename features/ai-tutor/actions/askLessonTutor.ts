"use server";

import { createClient } from "@/lib/supabase/server";
import { askAI } from "@/importer/ai/client";
import { buildDhadGuidedLessonPrompt } from "@/lib/ai/dhad-guided-lesson-policy";

type TutorResponse = {
  answer: string;
  error: string | null;
};

export async function askLessonTutor(
  lessonId: string,
  question: string
): Promise<TutorResponse> {
  const cleanedQuestion = question.trim();

  if (!cleanedQuestion) {
    return {
      answer: "",
      error: "اكتب سؤالك أولًا.",
    };
  }

  if (cleanedQuestion.length > 500) {
    return {
      answer: "",
      error: "السؤال طويل جدًا.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      answer: "",
      error: "يجب تسجيل الدخول لاستخدام المعلم الذكي.",
    };
  }

  // حفظ رسالة الطالب في قاعدة البيانات
  const { error: studentMessageError } = await supabase
    .from("ai_tutor_messages")
    .insert({
      user_id: user.id,
      lesson_id: lessonId,
      role: "student",
      content: cleanedQuestion,
    });

  if (studentMessageError) {
    console.error(
      "Failed to save student tutor message:",
      studentMessageError
    );
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(
      `
        id,
        title,
        summary,
        content,
        learning_objectives
      `
    )
    .eq("id", lessonId)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError) {
    console.error("Failed to load lesson for AI tutor:", lessonError);

    return {
      answer: "",
      error: "تعذر تحميل بيانات الدرس.",
    };
  }

  if (!lesson) {
    return {
      answer: "",
      error: "الدرس غير موجود أو غير منشور.",
    };
  }

  const { data: vocabulary } = await supabase
    .from("lesson_vocabulary")
    .select(
      `
      word,
      meaning,
      example
    `
    )
    .eq("lesson_id", lessonId)
    .order("display_order");

  const vocabularyContext = (vocabulary ?? [])
    .map((item) => {
      const example = item.example ? ` — مثال: ${item.example}` : "";

      return `${item.word}: ${item.meaning}${example}`;
    })
    .join("\n");

  const { data: recentTurns, error: turnsError } = await supabase
    .from("ai_tutor_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (turnsError) {
    console.error("Failed to load tutor context:", turnsError);
  }

  const previousTurns = (recentTurns ?? [])
    .reverse()
    .filter(
      (turn): turn is { role: "student" | "tutor"; content: string } =>
        (turn.role === "student" || turn.role === "tutor") &&
        typeof turn.content === "string",
    );

  const prompt = buildDhadGuidedLessonPrompt({
    title: lesson.title,
    summary: lesson.summary,
    objectives: lesson.learning_objectives,
    vocabulary: vocabularyContext,
    content: lesson.content,
    question: cleanedQuestion,
    previousTurns,
  });

  try {
    const answer = (await askAI(prompt)).trim();

    // حفظ رد المعلم الذكي في قاعدة البيانات
    const { error: tutorMessageError } = await supabase
      .from("ai_tutor_messages")
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        role: "tutor",
        content: answer,
      });

    if (tutorMessageError) {
      console.error("Failed to save tutor response:", tutorMessageError);
    }

    return {
      answer,
      error: null,
    };
  } catch (error) {
    console.error("AI tutor request failed:", error);

    return {
      answer: "",
      error: "تعذر الحصول على الإجابة الآن. حاول مرة أخرى.",
    };
  }
}
