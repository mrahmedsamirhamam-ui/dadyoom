import type {
  LessonRow,
  StudentProgressRow,
} from "@/types/database";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LessonCatalogItem = {
  id: string;
  title: string;
  objective: string | null;
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  points: number;
  order: number;
  completed: boolean;
  progressPercent: number;
};

export type UnitCatalog = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  /*
   * CANONICAL_CURRICULUM_SELECTOR_V1
   *
   * Structured curriculum context used by /courses.
   */
  country: {
    id: string;
    code: string;
    name: string;
  };
  curriculum: {
    id: string;
    name: string;
    academicYear: string | null;
  };
  grade: {
    id: string;
    name: string;
    number: number | null;
  };

  subject: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  lessons: LessonCatalogItem[];
};

export type LessonDetails = {
  id: string;
  title: string;
  objective: string | null;
  content: {
    sections?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  points: number;
  unitTitle: string;
  subjectName: string;
  completed: boolean;
  progressPercent: number;
};

/*
 * CANONICAL_STUDENT_CATALOG_V1
 *
 * المصدر الرسمي لرحلة الطالب:
 * countries -> curricula -> grades -> units -> lessons
 *
 * لا يستخدم edu_units / edu_lessons.
 */
type CanonicalLessonCatalogRow = {
  id: string;
  title: string;
  summary: string | null;
  estimated_minutes: number | null;
  lesson_number: number | null;
  status: string;
};

type UnitWithRelations = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
  unit_number: number | null;

  grades: {
    id: string;
    name_ar: string;
    grade_number: number | null;

    curricula: {
      id: string;
      name_ar: string;
      academic_year: string | null;
      is_active: boolean;

      countries: {
        id: string;
        code: string;
        name_ar: string;
        is_active: boolean;
      };
    };
  };

  lessons?: CanonicalLessonCatalogRow[];
};

type LessonDetailsRow = LessonRow & {
  slug?: string;
  is_published?: boolean;
  edu_units: {
    title: string;
    edu_subjects: {
      name_ar: string;
    };
  };
};

export async function getPublishedUnits(): Promise<UnitCatalog[]> {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  /*
   * CANONICAL_STUDENT_CATALOG_V1
   *
   * مهم:
   * معرف الدرس الخارج من هذه الدالة
   * هو نفسه معرف public.lessons المستخدم في:
   *
   * /lessons/[id]
   * get_lesson_page_bundle
   * assessment
   * lesson activities
   * student progress
   * Dad tutor
   */
  const {
    data,
    error,
  } =
    await supabase
      .from("units")
      .select(`
        id,
        title,
        description,
        sort_order,
        unit_number,

        grades!inner (
          id,
          name_ar,
          grade_number,

          curricula!inner (
            id,
            name_ar,
            academic_year,
            is_active,

            countries!inner (
              id,
              code,
              name_ar,
              is_active
            )
          )
        ),

        lessons (
          id,
          title,
          summary,
          estimated_minutes,
          lesson_number,
          status
        )
      `);

  if (error) {
    throw new Error(
      error.message
    );
  }


  /*
   * تقدم الطالب الرسمي للدروس.
   */
  let progressRows:
    StudentProgressRow[] = [];

  if (user) {
    const {
      data: progressData,
      error: progressError,
    } =
      await supabase
        .from(
          "student_lesson_progress"
        )
        .select(
          "lesson_id,status,progress_percent"
        )
        .eq(
          "student_id",
          user.id
        );

    if (!progressError) {
      progressRows =
        (progressData ?? []) as unknown as
          StudentProgressRow[];
    }
  }


  const progressByLesson =
    new Map(
      progressRows.map(
        (row) => [
          row.lesson_id,
          row,
        ]
      )
    );


  return (
    (data ?? []) as unknown as
      UnitWithRelations[]
  )
    /*
     * لا نعرض مناهج أو دولًا معطلة.
     */
    .filter(
      (unit) =>
        unit.grades
          ?.curricula
          ?.is_active !== false &&
        unit.grades
          ?.curricula
          ?.countries
          ?.is_active !== false
    )

    /*
     * ترتيب:
     * الصف -> الوحدة
     */
    .sort(
      (a, b) => {
        const gradeDiff =
          Number(
            a.grades
              ?.grade_number ??
              999
          ) -
          Number(
            b.grades
              ?.grade_number ??
              999
          );

        if (gradeDiff !== 0) {
          return gradeDiff;
        }

        const unitNumberDiff =
          Number(
            a.unit_number ??
              999
          ) -
          Number(
            b.unit_number ??
              999
          );

        if (
          unitNumberDiff !== 0
        ) {
          return unitNumberDiff;
        }

        return (
          Number(
            a.sort_order ?? 999
          ) -
          Number(
            b.sort_order ?? 999
          )
        );
      }
    )

    .map(
      (unit) => {
        const grade =
          unit.grades;

        const curriculum =
          grade.curricula;

        const country =
          curriculum.countries;


        const lessons =
          (
            unit.lessons ?? []
          )
            .filter(
              (lesson) =>
                lesson.status ===
                "published"
            )
            .sort(
              (a, b) =>
                Number(
                  a.lesson_number ??
                    999
                ) -
                Number(
                  b.lesson_number ??
                    999
                )
            )
            .map(
              (lesson) => {
                const progress =
                  progressByLesson.get(
                    lesson.id
                  );

                const status =
                  progress?.status ??
                  "";

                return {
                  id:
                    lesson.id,

                  title:
                    lesson.title,

                  objective:
                    lesson.summary ??
                    null,

                  estimatedMinutes:
                    Number(
                      lesson.estimated_minutes ??
                        15
                    ),

                  /*
                   * نموذج lessons الأساسي
                   * لا يستخدم difficulty
                   * كجزء من رحلة المنهج الحالية.
                   */
                  difficulty:
                    "beginner" as const,

                  /*
                   * XP الفعلي يحسبه
                   * نظام إكمال الدرس،
                   * وهذه فقط قيمة عرض.
                   */
                  points:
                    10,

                  order:
                    Number(
                      lesson.lesson_number ??
                        1
                    ),

                  completed:
                    status ===
                      "completed" ||
                    status ===
                      "mastered",

                  progressPercent:
                    Number(
                      progress
                        ?.progress_percent ??
                        0
                    ),
                } satisfies LessonCatalogItem;
              }
            );


        /*
         * نحافظ على contract الحالي
         * لصفحة /courses كي لا نعيد
         * بناء الواجهة الآن.
         *
         * subject هنا يمثل سياق المنهج
         * والصف حتى ننشئ selectors
         * في الخطوة التالية.
         */
        return {
          id:
            unit.id,

          title:
            unit.title,

          description:
            unit.description ??
            null,

          order:
            Number(
              unit.unit_number ??
                unit.sort_order ??
                1
            ),

          /*
           * CANONICAL_CURRICULUM_SELECTOR_V1
           */
          country: {
            id:
              country.id,

            code:
              country.code,

            name:
              country.name_ar,
          },

          curriculum: {
            id:
              curriculum.id,

            name:
              curriculum.name_ar,

            academicYear:
              curriculum.academic_year ??
              null,
          },

          grade: {
            id:
              grade.id,

            name:
              grade.name_ar,

            number:
              grade.grade_number ??
              null,
          },

          subject: {
            id:
              grade.id,

            name:
              [
                country.name_ar,
                curriculum.name_ar,
                grade.name_ar,
              ]
                .filter(Boolean)
                .join(" • "),

            icon:
              null,

            color:
              null,
          },

          lessons,
        } satisfies UnitCatalog;
      }
    )

    /*
     * لا نعرض وحدة ليس بها
     * أي درس منشور.
     */
    .filter(
      (unit) =>
        unit.lessons.length > 0
    );
}


export async function getLessonDetails(
  lessonId: string
): Promise<LessonDetails> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ø¶Ø§Ù: ÙÙƒ Ø§Ù„ØªØ±Ù…ÙŠØ² ÙˆØ§Ù„ØªØ­Ù‚Ù‚ Ù‡Ù„ Ø§Ù„Ù…Ø¹Ø±Ù UUID Ø£Ù… Slug ---
  const decodedLessonId = decodeURIComponent(lessonId);
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      decodedLessonId
    );

  let lessonQuery = supabase
    .from("edu_lessons")
    .select(`
      id,
      title,
      slug,
      objective,
      content,
      estimated_minutes,
      difficulty,
      points_reward,
      is_published,
      edu_units!inner (
        title,
        edu_subjects!inner (
          name_ar
        )
      )
    `)
    .eq("is_published", true);

  lessonQuery = isUuid
    ? lessonQuery.eq("id", decodedLessonId)
    : lessonQuery.eq("slug", decodedLessonId);

  const { data, error } = await lessonQuery.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const lessonData = data as unknown as LessonDetailsRow;
  let progress: StudentProgressRow | null = null;

  if (user) {
    const { data: progressData } = await supabase
      .from("edu_learner_progress")
      .select("status,progress_percent")
      .eq("student_id", user.id)
      .eq("lesson_id", lessonData.id)
      .maybeSingle();

    progress = (progressData ?? null) as unknown as StudentProgressRow | null;

    await supabase.from("edu_learner_progress").upsert(
      {
        student_id: user.id,
        lesson_id: lessonData.id,
        status:
          progress?.status === "completed" ? "completed" : "in_progress",
        progress_percent:
          progress?.status === "completed"
            ? 100
            : Math.max(Number(progress?.progress_percent ?? 0), 10),
        started_at: new Date().toISOString(),
        last_opened_at: new Date().toISOString(),
      },
      { onConflict: "student_id,lesson_id" }
    );
  }

  return {
    id: lessonData.id,
    title: lessonData.title,
    objective: lessonData.objective ?? null,
    content:
      lessonData.content && typeof lessonData.content === "object"
        ? (lessonData.content as Record<string, unknown>)
        : {},
    estimatedMinutes: Number(lessonData.estimated_minutes ?? 10),
    difficulty:
      lessonData.difficulty === "advanced" ||
      lessonData.difficulty === "intermediate"
        ? lessonData.difficulty
        : "beginner",
    points: Number(lessonData.points_reward ?? 10),
    unitTitle: lessonData.edu_units.title,
    subjectName: lessonData.edu_units.edu_subjects.name_ar,
    completed: progress?.status === "completed",
    progressPercent: Number(progress?.progress_percent ?? 0),
  };
}
