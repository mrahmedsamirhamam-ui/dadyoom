"use server";

import { logger } from "@/lib/logger";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type GeneratedLesson = {
  sourceText: string;
  sourceUrl: string;
  sourceLocked: boolean;

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
    options: string[];
    correctAnswer: string;
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

            options:
              Array.isArray(item.options)
                ? Array.from(
                    new Set(
                      item.options
                        .filter(
                          (option): option is string =>
                            typeof option === "string"
                        )
                        .map(
                          (option) =>
                            option.trim()
                        )
                        .filter(Boolean)
                    )
                  ).slice(
                    0,
                    4
                  )
                : [],

            correctAnswer:
              typeof item.correctAnswer === "string"
                ? item.correctAnswer.trim()
                : typeof item.correct_answer === "string"
                  ? item.correct_answer.trim()
                  : "",

            answer:
              typeof item.answer === "string"
                ? item.answer.trim()
                : "",
          }))
          .filter(
            (item) =>
              item.question ||
              item.answer ||
              item.options.length > 0
          )
          .slice(
            0,
            15
          )
      : [];

    const generatedLesson: GeneratedLesson = {
      sourceText:
        typeof data.sourceText === "string"
          ? data.sourceText
              .trim()
              .slice(0, 18000)
          : "",

      sourceUrl:
        typeof data.sourceUrl === "string"
          ? data.sourceUrl
              .trim()
              .slice(0, 2000)
          : "",

      sourceLocked:
        data.sourceLocked === true,

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


  if (
    generatedLesson.sourceLocked &&
    (
      generatedLesson.sourceText.length < 160 ||
      !generatedLesson.sourceUrl
    )
  ) {
    redirect(
      "/admin/lessons/new?error=\u0646\u0635 \u0627\u0644\u0645\u0635\u062f\u0631 \u0627\u0644\u0645\u0642\u0641\u0644 \u063a\u064a\u0631 \u0645\u0643\u062a\u0645\u0644"
    );
  }

  /*
   * CANONICAL_GENERATED_LESSON_SAVE_V1
   *
   * الحقول التي يستخدمها مسار الطالب الحقيقي.
   */
  const vocabularyText =
    generatedLesson.vocabulary.length > 0
      ? [
          "المفردات:",
          ...generatedLesson.vocabulary.map(
            (item) =>
              `- ${item.word}: ${item.meaning}${
                item.example
                  ? ` — مثال: ${item.example}`
                  : ""
              }`
          ),
        ].join("\n")
      : "";

  const activitiesText =
    generatedLesson.activities.length > 0
      ? [
          "الأنشطة:",
          ...generatedLesson.activities.map(
            (item, index) =>
              `${index + 1}. ${item.title}
${item.instructions}`
          ),
        ].join("\n\n")
      : "";

  const assessmentText =
    generatedLesson.assessment.length > 0
      ? [
          "التقويم:",
          ...generatedLesson.assessment.map(
            (item, index) =>
              `${index + 1}. ${item.question}
الإجابة النموذجية: ${item.answer}`
          ),
        ].join("\n\n")
      : "";

  const canonicalContent =
    [
      generatedLesson.sourceText
        ? `\u0646\u0635 \u0627\u0644\u0645\u0635\u062f\u0631:
${generatedLesson.sourceText}`
        : "",

      generatedLesson.introduction
        ? `التمهيد:
${generatedLesson.introduction}`
        : "",

      generatedLesson.explanation
        ? `شرح ضاديوم:
${generatedLesson.explanation}`
        : "",

      vocabularyText,

      activitiesText,

      assessmentText,

      generatedLesson.homework
        ? `الواجب المنزلي:
${generatedLesson.homework}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

  const canonicalSummary =
    (
      generatedLesson.introduction ||
      generatedLesson.explanation
    )
      .trim()
      .slice(
        0,
        1000
      );

  const canonicalStatus =
    isPublished
      ? "published"
      : "draft";

  /*
   * URL_LESSON_INTERACTIVE_V2
   *
   * ????? ?????? ?????? ??????
   * ?????? ???????.
   */

  type InteractiveQuestionTemplate = {
    question_order: number;
    question: string;
    question_type: string;

    options: Array<{
      id: string;
      text: string;
    }>;

    correct_answer: string;

    explanation:
      string | null;

    points: number;
  };


  const interactiveQuestionTemplates:
    InteractiveQuestionTemplate[] =
      [];


  for (
    const item of
      generatedLesson.assessment
  ) {
    const options =
      Array.from(
        new Set(
          item.options
            .map(
              (option) =>
                option.trim()
            )
            .filter(Boolean)
        )
      ).slice(
        0,
        4
      );


    if (
      !item.question.trim() ||
      options.length !== 4
    ) {
      continue;
    }


    const correctAnswer =
      item.correctAnswer.trim();


    if (
      !correctAnswer ||
      !options.includes(
        correctAnswer
      )
    ) {
      continue;
    }


    /*
     * ???? id = text.
     *
     * ???? ???? correct_answer ???????? ????
     * ????? ????? ?????? ?? ???? ??????
     * ?? ?? ?? ??????.
     */
    interactiveQuestionTemplates.push({
      question_order:
        interactiveQuestionTemplates.length +
        1,

      question:
        item.question.trim(),

      question_type:
        "multiple_choice",

      options:
        options.map(
          (text) => ({
            id:
              text,

            text,
          })
        ),

      correct_answer:
        correctAnswer,

      explanation:
        item.answer.trim() ||
        null,

      points:
        1,
    });
  }


  /*
   * ???? ???? ?????? ???? ?? reading.
   * ?? ????? ?????? ?? ?????? ??? ?????.
   */
  const interactiveActivityTemplates =
    generatedLesson.activities
      .map(
        (
          item,
          index
        ) => {
          const activityText =
            (
              item.instructions ||
              item.title
            ).trim();


          return {
            title:
              item.title.trim() ||
              `???? ${index + 1}`,

            activity_type:
              "reading",

            instructions:
              item.instructions.trim() ||
              null,

            content: {
              text:
                activityText,
            },

            activity_order:
              index + 1,

            points:
              5,

            is_published:
              false,

            section:
              "\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062f\u0631\u0633",

            prompt:
              item.instructions.trim() ||
              null,

            answer: {},

            is_required:
              true,
          };
        }
      )
      .filter(
        (item) =>
          Boolean(
            item.content.text
          )
      );


  if (
    interactiveQuestionTemplates
      .length === 0
  ) {
    redirect(
      "/admin/lessons/new?error=??? ????? ????? ??? ????? ???????? ?? ????? ??? ??????"
    );
  }


  if (
    interactiveActivityTemplates
      .length === 0
  ) {
    redirect(
      "/admin/lessons/new?error=??? ????? ????? ??? ??????? ??? ??????"
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
        lesson_type: skill,
        estimated_minutes: estimatedMinutes,
status:
          "draft",

        content:
          canonicalContent,

        summary:
          canonicalSummary ||
          null,

        learning_objectives:
          generatedLesson.objectives,
        vocabulary: generatedLesson.vocabulary,
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

  /*
   * QUESTIONS
   */

  const {
    error:
      questionsError,
  } =
    await supabase
      .from(
        "questions"
      )
      .insert(
        interactiveQuestionTemplates.map(
          (item) => ({
            ...item,

            lesson_id:
              insertedLesson.id,
          })
        )
      );


  if (questionsError) {
    console.error(
      "CREATE_LESSON_QUESTIONS_ERROR:",
      questionsError
    );

    redirect(
      `/admin/lessons/new?error=${encodeURIComponent(
        `?? ??? ????? ??????? ??? ???? ??? ???????: ${questionsError.message}`
      )}`
    );
  }


  /*
   * ACTIVITIES
   */

  const {
    error:
      activitiesError,
  } =
    await supabase
      .from(
        "lesson_activities"
      )
      .insert(
        interactiveActivityTemplates.map(
          (item) => ({
            ...item,

            lesson_id:
              insertedLesson.id,
          })
        )
      );


  if (activitiesError) {
    console.error(
      "CREATE_LESSON_ACTIVITIES_ERROR:",
      activitiesError
    );

    redirect(
      `/admin/lessons/new?error=${encodeURIComponent(
        `?? ??? ????? ??????? ??? ???? ??? ???????: ${activitiesError.message}`
      )}`
    );
  }


  /*
   * PUBLISH LAST
   *
   * ?? ???? ????? ??? ???? ???? ???????.
   */

  if (
    canonicalStatus ===
    "published"
  ) {
    const {
      error:
        activitiesPublishError,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .update({
          is_published:
            true,
        })
        .eq(
          "lesson_id",
          insertedLesson.id
        );


    if (
      activitiesPublishError
    ) {
      redirect(
        `/admin/lessons/new?error=${encodeURIComponent(
          `?? ????? ????? ????? ??? ??? ??????? ????: ${activitiesPublishError.message}`
        )}`
      );
    }


    const {
      error:
        lessonPublishError,
    } =
      await supabase
        .from(
          "lessons"
        )
        .update({
          status:
            "published",
        })
        .eq(
          "id",
          insertedLesson.id
        );


    if (
      lessonPublishError
    ) {
      redirect(
        `/admin/lessons/new?error=${encodeURIComponent(
          `?? ????? ??????? ???? ???? ??? ?????: ${lessonPublishError.message}`
        )}`
      );
    }
  }


  logger.debug(
    "LESSON_CREATED_SUCCESSFULLY:",
    insertedLesson
  );

  revalidatePath("/admin/lessons");
  revalidatePath(
    `/lessons/${insertedLesson.id}`
  );

  redirect("/admin/lessons");
}