import { NextResponse } from "next/server";

import { ARAB_COUNTRY_CODES } from "@/lib/countries";
import { createClient } from "@/lib/supabase/server";

type RawLesson = {
  id: string;
  title: string;
  summary: string | null;
  estimated_minutes: number | null;
  lesson_number: number | null;
  sort_order: number | null;
  status: string;
};

type Country = {
  id: string;
  code: string;
  name_ar: string;
  is_active: boolean;
};

type Curriculum = {
  id: string;
  name_ar: string;
  academic_year: string | null;
  is_active: boolean;
  countries: Country | Country[] | null;
};

type Grade = {
  id: string;
  name_ar: string;
  grade_number: number | null;
  curricula: Curriculum | Curriculum[] | null;
};

type RawUnit = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
  unit_number: number | null;
  grades: Grade | Grade[] | null;
  lessons?: RawLesson[] | null;
};

type Progress = {
  lesson_id: string;
  status: string | null;
  progress_percent: number | null;
  xp: number | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function difficulty(grade: number | null) {
  const value = Number(grade ?? 0);
  return value >= 9
    ? ("advanced" as const)
    : value >= 4
      ? ("intermediate" as const)
      : ("beginner" as const);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = String(url.searchParams.get("country") ?? "")
    .trim()
    .toUpperCase();
  const grade = Number(url.searchParams.get("grade") ?? 0);

  if (
    !(ARAB_COUNTRY_CODES as readonly string[]).includes(country) ||
    !Number.isInteger(grade) ||
    grade < 1 ||
    grade > 13
  ) {
    return NextResponse.json(
      { error: "اختيار الدولة أو الصف غير صالح." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("units")
    .select(`
      id,title,description,sort_order,unit_number,
      grades!inner(
        id,name_ar,grade_number,
        curricula!inner(
          id,name_ar,academic_year,is_active,
          countries!inner(id,code,name_ar,is_active)
        )
      ),
      lessons!inner(
        id,title,summary,estimated_minutes,lesson_number,sort_order,status
      )
    `)
    .eq("grades.grade_number", grade)
    .eq("grades.curricula.is_active", true)
    .eq("grades.curricula.countries.code", country)
    .eq("grades.curricula.countries.is_active", true)
    .eq("lessons.status", "published")
    .limit(120);

  if (error) {
    console.error("DADYOOM_SCOPED_CATALOG_ERROR", error);
    return NextResponse.json(
      { error: "تعذر تحميل دروس هذا الصف الآن." },
      { status: 503 },
    );
  }

  const rawUnits = (data ?? []) as unknown as RawUnit[];
  const lessonIds = rawUnits.flatMap((unit) =>
    (unit.lessons ?? []).map((lesson) => lesson.id),
  );

  let progress: Progress[] = [];

  if (user && lessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("student_lesson_progress")
      .select("lesson_id,status,progress_percent,xp")
      .eq("student_id", user.id)
      .in("lesson_id", lessonIds);

    progress = (progressRows ?? []) as unknown as Progress[];
  }

  const progressByLesson = new Map(
    progress.map((row) => [row.lesson_id, row]),
  );

  const units = rawUnits
    .map((raw) => {
      const gradeRow = one(raw.grades);
      const curriculum = one(gradeRow?.curricula);
      const countryRow = one(curriculum?.countries);

      if (!gradeRow || !curriculum || !countryRow) return null;

      const lessons = (raw.lessons ?? [])
        .filter((lesson) => lesson.status === "published")
        .sort(
          (a, b) =>
            Number(a.sort_order ?? a.lesson_number ?? 9999) -
            Number(b.sort_order ?? b.lesson_number ?? 9999),
        )
        .map((lesson, index) => {
          const row = progressByLesson.get(lesson.id);
          const completed =
            row?.status === "completed" || row?.status === "mastered";

          return {
            id: lesson.id,
            title: lesson.title,
            objective: lesson.summary,
            estimatedMinutes: Number(lesson.estimated_minutes ?? 20),
            difficulty: difficulty(gradeRow.grade_number),
            points: Math.max(10, Number(row?.xp ?? 0)),
            order: Number(
              lesson.sort_order ?? lesson.lesson_number ?? index + 1,
            ),
            completed,
            progressPercent: completed
              ? 100
              : Math.max(
                  0,
                  Math.min(100, Number(row?.progress_percent ?? 0)),
                ),
          };
        });

      if (!lessons.length) return null;

      return {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        order: Number(raw.sort_order ?? raw.unit_number ?? 9999),
        country: {
          id: countryRow.id,
          code: countryRow.code,
          name: countryRow.name_ar,
        },
        curriculum: {
          id: curriculum.id,
          name: curriculum.name_ar,
          academicYear: curriculum.academic_year,
        },
        grade: {
          id: gradeRow.id,
          name: gradeRow.name_ar,
          number: gradeRow.grade_number,
        },
        lessons,
      };
    })
    .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit))
    .sort((a, b) => a.order - b.order);

  return NextResponse.json(
    { units },
    {
      headers: {
        "Cache-Control": user
          ? "private, no-store"
          : "public, max-age=60, s-maxage=300",
      },
    },
  );
}
