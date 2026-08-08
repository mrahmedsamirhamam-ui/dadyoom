"use server";

import { logger } from "@/lib/logger";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type GeneratedLesson = {
  objectives: string[];
  introduction: string;
  explanation: string;
  vocabulary: Array<{
    word: string;
    meaning: string;
    example: string;
  }>;
  activities: Array<{
    title: string;
    instructions: string;
  }>;
  assessment: Array<{
    question: string;
    answer: string;
  }>;
  homework: string;
};

function createSlug(title: string) {
  const cleanTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeTitle = cleanTitle || "lesson";

  return `${safeTitle}-${Date.now()}`;
}

function getRequiredString(
  formData: FormData,
  key: string
) {
  return String(formData.get(key) ?? "").trim();
}

function parsePositiveNumber(
  value: FormDataEntryValue | null,
  fallback: number,
  minimum: number
) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < minimum) {
    return fallback;
  }

  return Math.round(parsed);
}

function parseGeneratedLesson(
  rawValue: FormDataEntryValue | null
): GeneratedLesson | null {
  if (
    typeof rawValue !== "string" ||
    !rawValue.trim()
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const data = parsed as Record<string, unknown>;

    const objectives = Array.isArray(data.objectives)
      ? data.objectives
          .filter(
            (item): item is string =>
              typeof item === "string"
          )
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];

    const vocabulary = Array.isArray(data.vocabulary)
      ? data.vocabulary
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
              item.word ||
              item.meaning ||
              item.example
          )
          .slice(0, 15)
      : [];

    const activities = Array.isArray(data.activities)
      ? data.activities
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
          )
          .slice(0, 10)
      : [];

    const assessment = Array.isArray(data.assessment)
      ? data.assessment
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
          )
          .slice(0, 15)
      : [];

    const generatedLesson: GeneratedLesson = {
      objectives,
      introduction:
        typeof data.introduction === "string"
          ? data.introduction.trim()
          : "",
      explanation:
        typeof data.explanation === "string"
          ? data.explanation.trim()
          : "",
      vocabulary,
      activities,
      assessment,
      homework:
        typeof data.homework === "string"
          ? data.homework.trim()
          : "",
    };

    const hasContent =
      generatedLesson.objectives.length > 0 ||
      Boolean(generatedLesson.introduction) ||
      Boolean(generatedLesson.explanation) ||
      generatedLesson.vocabulary.length > 0 ||
      generatedLesson.activities.length > 0 ||
      generatedLesson.assessment.length > 0 ||
      Boolean(generatedLesson.homework);

    return hasContent ? generatedLesson : null;
  } catch (error) {
    console.error(
      "PARSE_GENERATED_LESSON_ERROR:",
      error
    );

    return null;
  }
}

export async function createLesson(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      "/login?error=يجب تسجيل الدخول أولًا"
    );
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (
    profileError ||
    profile?.role?.trim().toLowerCase() !==
      "admin"
  ) {
    redirect(
      "/admin/lessons/new?error=غير مصرح لك بإضافة الدروس"
    );
  }

  const title = getRequiredString(
    formData,
    "title"
  );

  const unitId = getRequiredString(
    formData,
    "unit_id"
  );

  const skill = getRequiredString(
    formData,
    "skill"
  );

  const difficultyLevel = getRequiredString(
    formData,
    "difficulty_level"
  );

  const estimatedMinutes =
    parsePositiveNumber(
      formData.get("estimated_minutes"),
      20,
      1
    );

  const points = parsePositiveNumber(
    formData.get("points"),
    10,
    0
  );

  const isPublished =
    formData.get("is_published") === "true";

  const rawGeneratedContent =
    formData.get("generated_content");

  logger.debug(
    "GENERATED_CONTENT_RAW:",
    rawGeneratedContent
  );

  const generatedLesson =
    parseGeneratedLesson(rawGeneratedContent);

  logger.debug(
    "GENERATED_LESSON_PARSED:",
    generatedLesson
  );

  if (!title) {
    redirect(
      "/admin/lessons/new?error=اكتب عنوان الدرس"
    );
  }

  if (!unitId) {
    redirect(
      "/admin/lessons/new?error=اختر الوحدة"
    );
  }

  if (!skill) {
    redirect(
      "/admin/lessons/new?error=اختر المهارة"
    );
  }

  if (!difficultyLevel) {
    redirect(
      "/admin/lessons/new?error=اختر مستوى الصعوبة"
    );
  }

  if (!generatedLesson) {
    redirect(
      "/admin/lessons/new?error=يجب توليد محتوى الدرس قبل الحفظ"
    );
  }

  const { data: insertedLesson, error } =
    await supabase
      .from("lessons")
      .insert({
        created_by: user.id,
        title,
        slug: createSlug(title),
        unit_id: unitId,
        skill,
        difficulty_level: difficultyLevel,
        estimated_minutes: estimatedMinutes,
        points,
        is_published: isPublished,
        objectives: generatedLesson.objectives,
        introduction:
          generatedLesson.introduction || null,
        explanation:
          generatedLesson.explanation || null,
        vocabulary: generatedLesson.vocabulary,
        activities: generatedLesson.activities,
        assessment: generatedLesson.assessment,
        homework:
          generatedLesson.homework || null,
      })
      .select("id,slug")
      .single();

  if (error) {
    console.error(
      "CREATE_LESSON_ERROR:",
      error
    );

    redirect(
      `/admin/lessons/new?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  logger.debug(
    "LESSON_CREATED_SUCCESSFULLY:",
    insertedLesson
  );

  revalidatePath("/admin/lessons");
  revalidatePath(
    `/lessons/${insertedLesson.slug}`
  );

  redirect("/admin/lessons");
}