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

type UnitWithRelations = {
  id: string;
  title: string;
  description?: string | null;
  order_no?: number | null;
  edu_subjects: {
    id: string;
    name_ar: string;
    icon?: string | null;
    color?: string | null;
  };
  edu_lessons?: LessonRow[];
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("edu_units")
    .select(`
      id,
      title,
      description,
      order_no,
      edu_subjects!inner (
        id,
        name_ar,
        icon,
        color
      ),
      edu_lessons (
        id,
        title,
        objective,
        estimated_minutes,
        difficulty,
        points_reward,
        order_no,
        is_published
      )
    `)
    .eq("is_published", true)
    .order("order_no", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  let progressRows: StudentProgressRow[] = [];

  if (user) {
    const { data: progressData, error: progressError } = await supabase
      .from("edu_learner_progress")
      .select("lesson_id,status,progress_percent")
      .eq("student_id", user.id);

    if (!progressError) {
      progressRows = (progressData ?? []) as unknown as StudentProgressRow[];
    }
  }

  const progressByLesson = new Map(
    progressRows.map((row) => [row.lesson_id, row])
  );

  return ((data ?? []) as unknown as UnitWithRelations[])
    .map((unit) => {
      const subject = unit.edu_subjects;
      const lessons = (unit.edu_lessons ?? [])
        .filter((lesson: LessonRow) => lesson.is_published === true)
        .sort(
          (a: LessonRow, b: LessonRow) =>
            Number(a.order_no ?? 0) - Number(b.order_no ?? 0)
        )
        .map((lesson: LessonRow) => {
          const progress = progressByLesson.get(lesson.id);

          return {
            id: lesson.id,
            title: lesson.title ?? "Ø¯Ø±Ø³ Ø¨Ø¯ÙˆÙ† Ø¹Ù†ÙˆØ§Ù†",
            objective: lesson.objective ?? null,
            estimatedMinutes: Number(lesson.estimated_minutes ?? 10),
            difficulty:
              lesson.difficulty === "advanced" ||
              lesson.difficulty === "intermediate"
                ? lesson.difficulty
                : "beginner",
            points: Number(lesson.points_reward ?? 10),
            order: Number(lesson.order_no ?? 1),
            completed: progress?.status === "completed",
            progressPercent: Number(progress?.progress_percent ?? 0),
          } satisfies LessonCatalogItem;
        });

      return {
        id: unit.id,
        title: unit.title,
        description: unit.description ?? null,
        order: Number(unit.order_no ?? 1),
        subject: {
          id: subject.id,
          name: subject.name_ar,
          icon: subject.icon ?? null,
          color: subject.color ?? null,
        },
        lessons,
      } satisfies UnitCatalog;
    })
    .filter((unit) => unit.lessons.length > 0);
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
