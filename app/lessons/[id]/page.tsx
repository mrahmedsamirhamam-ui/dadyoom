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
  introduction: unknown;
  explanation: unknown;
  vocabulary: unknown;
  activities: unknown;
  assessment: unknown;
  homework: unknown;
  is_published: boolean | null;
  unit_id: string | null;
};

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function asText(value: unknown): string {
  const parsed = parseJsonValue(value);

  if (typeof parsed === "string") {
    return parsed.trim();
  }

  if (Array.isArray(parsed)) {
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n");
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    const possibleText =
      record.text ??
      record.content ??
      record.description ??
      record.value;

    return typeof possibleText === "string"
      ? possibleText.trim()
      : "";
  }

  return "";
}

function asStringArray(value: unknown): string[] {
  const parsed = parseJsonValue(value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => {
        if (typeof item === "string") return item.trim();

        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const text =
            record.objective ??
            record.text ??
            record.content ??
            record.value;

          return typeof text === "string" ? text.trim() : "";
        }

        return "";
      })
      .filter(Boolean);
  }

  if (typeof parsed === "string") {
    return parsed
      .split(/\r?\n|[•▪◦]/)
      .map((item) => item.replace(/^\s*[-––—]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
}

function asVocabulary(value: unknown): VocabularyItem[] {
  const parsed = parseJsonValue(value);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        !Array.isArray(item)
    )
    .map((item) => ({
      word:
        typeof (item.word ?? item.term ?? item.vocabulary) === "string"
          ? String(item.word ?? item.term ?? item.vocabulary).trim()
          : "",
      meaning:
        typeof (item.meaning ?? item.definition) === "string"
          ? String(item.meaning ?? item.definition).trim()
          : "",
      example:
        typeof (item.example ?? item.sentence) === "string"
          ? String(item.example ?? item.sentence).trim()
          : "",
    }))
    .filter((item) => item.word || item.meaning || item.example);
}

function asActivities(value: unknown): ActivityItem[] {
  const parsed = parseJsonValue(value);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          title: `النشاط ${index + 1}`,
          instructions: item.trim(),
        };
      }

      if (
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
      ) {
        const record = item as Record<string, unknown>;

        return {
          title:
            typeof (record.title ?? record.name) === "string"
              ? String(record.title ?? record.name).trim()
              : `النشاط ${index + 1}`,
          instructions:
            typeof (
              record.instructions ??
              record.description ??
              record.content
            ) === "string"
              ? String(
                  record.instructions ??
                    record.description ??
                    record.content
                ).trim()
              : "",
        };
      }

      return {
        title: "",
        instructions: "",
      };
    })
    .filter((item) => item.title || item.instructions);
}

function asAssessment(value: unknown): AssessmentItem[] {
  const parsed = parseJsonValue(value);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        !Array.isArray(item)
    )
    .map((item) => ({
      question:
        typeof (item.question ?? item.prompt) === "string"
          ? String(item.question ?? item.prompt).trim()
          : "",
      answer:
        typeof (
          item.answer ??
          item.correctAnswer ??
          item.correct_answer
        ) === "string"
          ? String(
              item.answer ??
                item.correctAnswer ??
                item.correct_answer
            ).trim()
          : "",
    }))
    .filter((item) => item.question || item.answer);
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

    throw new Error("تعذر تحميل الدرس في الوقت الحالي.");
  }

  if (!data) {
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
        objectives: asStringArray(lesson.objectives),
        introduction: asText(lesson.introduction),
        explanation: asText(lesson.explanation),
        vocabulary: asVocabulary(lesson.vocabulary),
        activities: asActivities(lesson.activities),
        assessment: asAssessment(lesson.assessment),
        homework: asText(lesson.homework),
      }}
    />
  );
}