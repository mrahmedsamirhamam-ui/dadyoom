import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LessonView from "./lesson-view";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type VocabularyItem = {
  word: string;
  meaning: string;
  example: string;
};

type ActivityItem = {
  title: string;
  instructions: string;
};

type AssessmentItem = {
  question: string;
  answer: string;
};

type LessonRow = {
  id: string;
  title: string;
  skill: string | null;
  difficulty_level: string | null;
  estimated_minutes: number | null;
  points: number | null;
  objectives: unknown;
  introduction: string | null;
  explanation: string | null;
  vocabulary: unknown;
  activities: unknown;
  assessment: unknown;
  homework: string | null;
  is_published: boolean | null;
  unit_id: string | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asVocabulary(value: unknown): VocabularyItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        !Array.isArray(item)
    )
    .map((item) => ({
      word:
        typeof item.word === "string"
          ? item.word.trim()
          : "",
      meaning:
        typeof item.meaning === "string"
          ? item.meaning.trim()
          : "",
      example:
        typeof item.example === "string"
          ? item.example.trim()
          : "",
    }))
    .filter(
      (item) =>
        item.word || item.meaning || item.example
    );
}

function asActivities(value: unknown): ActivityItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        !Array.isArray(item)
    )
    .map((item) => ({
      title:
        typeof item.title === "string"
          ? item.title.trim()
          : "",
      instructions:
        typeof item.instructions === "string"
          ? item.instructions.trim()
          : "",
    }))
    .filter(
      (item) =>
        item.title || item.instructions
    );
}

function asAssessment(value: unknown): AssessmentItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        !Array.isArray(item)
    )
    .map((item) => ({
      question:
        typeof item.question === "string"
          ? item.question.trim()
          : "",
      answer:
        typeof item.answer === "string"
          ? item.answer.trim()
          : "",
    }))
    .filter(
      (item) =>
        item.question || item.answer
    );
}

function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

export default async function LessonPage({
  params,
}: PageProps) {
  const { id } = await params;
  const decodedSlug = decodeSlug(id);

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/lessons/${decodedSlug}`
      )}`
    );
  }

  const { data: visibleLessons, error: visibleLessonsError } =
    await supabase
      .from("lessons")
      .select("id,title,is_published")
      .limit(10);

  console.log("VISIBLE_LESSONS:", visibleLessons);
  console.log("VISIBLE_LESSONS_ERROR:", visibleLessonsError);

  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id,title,skill,difficulty_level,estimated_minutes,points,objectives,introduction,explanation,vocabulary,activities,assessment,homework,is_published,unit_id"
    )
    .eq("id", decodedSlug)
    .maybeSingle();

  if (error) {
    console.error("FETCH_LESSON_ERROR:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      requestedSlug: id,
      decodedSlug,
    });

    throw new Error(
      "تعذر تحميل الدرس في الوقت الحالي."
    );
  }

  if (!data) {
    console.error("LESSON_NOT_FOUND:", {
      requestedSlug: id,
      decodedSlug,
      userId: user.id,
    });

    notFound();
  }

  const lesson = data as LessonRow;

  return (
    <LessonView
      lesson={{
        id: lesson.id,
        title: lesson.title,
        skill: lesson.skill ?? "general",
        difficultyLevel:
          lesson.difficulty_level ?? "beginner",
        estimatedMinutes:
          lesson.estimated_minutes ?? 20,
        points: lesson.points ?? 10,
        objectives: asStringArray(
          lesson.objectives
        ),
        introduction:
          lesson.introduction ?? "",
        explanation:
          lesson.explanation ?? "",
        vocabulary: asVocabulary(
          lesson.vocabulary
        ),
        activities: asActivities(
          lesson.activities
        ),
        assessment: asAssessment(
          lesson.assessment
        ),
        homework: lesson.homework ?? "",
      }}
    />
  );
}