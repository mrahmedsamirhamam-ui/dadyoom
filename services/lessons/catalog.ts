import type { StudentProgressRow } from "@/types/database";
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
