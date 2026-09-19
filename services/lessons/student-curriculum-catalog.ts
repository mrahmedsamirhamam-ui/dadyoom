"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type StudentCatalogLesson = {
  id: string; title: string; objective: string | null;
  estimatedMinutes: number; difficulty: "beginner" | "intermediate" | "advanced";
  points: number; order: number; completed: boolean; progressPercent: number;
};

export type StudentCatalogUnit = {
  id: string; title: string; description: string | null; order: number;
  country: { id: string; code: string; name: string };
  curriculum: { id: string; name: string; academicYear: string | null };
  grade: { id: string; name: string; number: number | null };
  lessons: StudentCatalogLesson[];
};

type RawLesson = {
  id: string; title: string; summary: string | null;
  estimated_minutes: number | null; lesson_number: number | null;
  sort_order: number | null; status: string;
};

type Country = { id: string; code: string; name_ar: string; is_active: boolean };
type Curriculum = {
  id: string; name_ar: string; academic_year: string | null; is_active: boolean;
  countries: Country | Country[] | null;
};
type Grade = {
  id: string; name_ar: string; grade_number: number | null;
  curricula: Curriculum | Curriculum[] | null;
};
type RawUnit = {
  id: string; title: string; description: string | null;
  sort_order: number | null; unit_number: number | null;
  grades: Grade | Grade[] | null; lessons?: RawLesson[] | null;
};
type Progress = {
  lesson_id: string; status: string | null;
  progress_percent: number | null; xp: number | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}
function level(g: number | null) {
  const n = Number(g ?? 0);
  return n >= 9 ? "advanced" as const : n >= 4 ? "intermediate" as const : "beginner" as const;
}

export async function getStudentCurriculumCatalog(): Promise<StudentCatalogUnit[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let allowBahrainDraftPreview = false;
  let preferredCountryCode = "";

  if (user) {
    const { data: previewProfile } =
      await supabase
        .from("profiles")
        .select("country")
        .eq("id", user.id)
        .maybeSingle();

    const profileCountry =
      String(
        previewProfile?.country ??
        user.user_metadata?.country ??
        ""
      )
        .trim()
        .toUpperCase();

    preferredCountryCode =
      profileCountry === "BAHRAIN" ||
      profileCountry === "البحرين"
        ? "BH"
        : profileCountry;

    allowBahrainDraftPreview =
      process.env.DADYOOM_BAHRAIN_PREVIEW === "true" &&
      preferredCountryCode === "BH";
  }

  const catalogDb =
    allowBahrainDraftPreview
      ? createAdminClient()
      : supabase;

  const { data, error } = await catalogDb.from("units").select(`
    id,title,description,sort_order,unit_number,
    grades!inner(
      id,name_ar,grade_number,
      curricula!inner(
        id,name_ar,academic_year,is_active,
        countries!inner(id,code,name_ar,is_active)
      )
    ),
    lessons(id,title,summary,estimated_minutes,lesson_number,sort_order,status)
  `);

  if (error) throw new Error(`تعذر تحميل المناهج: ${error.message}`);

  let progress: Progress[] = [];
  if (user) {
    const { data: p } = await supabase
      .from("student_lesson_progress")
      .select("lesson_id,status,progress_percent,xp")
      .eq("student_id", user.id);
    progress = (p ?? []) as unknown as Progress[];
  }
  const byLesson = new Map(progress.map((p) => [p.lesson_id, p]));
  const out: StudentCatalogUnit[] = [];

  for (const raw of (data ?? []) as unknown as RawUnit[]) {
    const grade = one(raw.grades);
    const curriculum = one(grade?.curricula);
    const country = one(curriculum?.countries);
    if (!grade || !curriculum || !country || !curriculum.is_active || !country.is_active) continue;

    const lessons = (raw.lessons ?? [])
      .filter(
        (x) =>
          x.status === "published" ||
          (
            allowBahrainDraftPreview &&
            String(country.code).trim().toUpperCase() === "BH" &&
            x.status === "draft"
          )
      )
      .sort((a,b) => Number(a.sort_order ?? a.lesson_number ?? 9999) - Number(b.sort_order ?? b.lesson_number ?? 9999));
    if (!lessons.length) continue;

    out.push({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      order: Number(raw.sort_order ?? raw.unit_number ?? 9999),
      country: { id: country.id, code: country.code, name: country.name_ar },
      curriculum: { id: curriculum.id, name: curriculum.name_ar, academicYear: curriculum.academic_year },
      grade: { id: grade.id, name: grade.name_ar, number: grade.grade_number },
      lessons: lessons.map((lesson, index) => {
        const p = byLesson.get(lesson.id);
        const completed = p?.status === "completed" || p?.status === "mastered";
        return {
          id: lesson.id,
          title: lesson.title,
          objective: lesson.summary,
          estimatedMinutes: Number(lesson.estimated_minutes ?? 20),
          difficulty: level(grade.grade_number),
          points: Math.max(10, Number(p?.xp ?? 0)),
          order: Number(lesson.sort_order ?? lesson.lesson_number ?? index + 1),
          completed,
          progressPercent: completed ? 100 : Math.max(0, Math.min(100, Number(p?.progress_percent ?? 0))),
        };
      }),
    });
  }

  return out.sort((a,b) => {
    if (preferredCountryCode) {
      const aPreferred =
        String(a.country.code).trim().toUpperCase() === preferredCountryCode
          ? 0
          : 1;

      const bPreferred =
        String(b.country.code).trim().toUpperCase() === preferredCountryCode
          ? 0
          : 1;

      if (aPreferred !== bPreferred) {
        return aPreferred - bPreferred;
      }
    }

    return (
      Number(a.grade.number ?? 999) -
        Number(b.grade.number ?? 999) ||
      a.curriculum.name.localeCompare(
        b.curriculum.name,
        "ar"
      ) ||
      a.order - b.order
    );
  });
}
