import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type SubjectRow = {
  id: string;
  title?: string | null;
  name_ar?: string | null;
  icon?: string | null;
  color?: string | null;
  order_no?: number | null;
  edu_grades?: {
    name_ar?: string | null;
    edu_curricula?: {
      name_ar?: string | null;
      edu_countries?: {
        name_ar?: string | null;
      } | null;
    } | null;
  } | null;
  units?: UnitRow[] | null;
  edu_units?: UnitRow[] | null;
};

type UnitRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  edu_lessons?: { id: string }[] | null;
};

export type CourseSummary = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  grade: string | null;
  curriculum: string | null;
  country: string | null;
  lessons_count: number;
};

/**
 * يحافظ على اسم getCourses القديم، لكنه يقرأ الآن من بنية edu_*.
 * كل مادة دراسية تُعامل كـ Course داخل الواجهة الحالية.
 */
export async function getCourses(
  supabase: SupabaseClient<Database>
): Promise<CourseSummary[]> {
  const { data, error } = await supabase
    .from("edu_subjects")
    .select(`
      id,
      name_ar,
      icon,
      color,
      order_no,
      edu_grades!inner (
        name_ar,
        edu_curricula!inner (
          name_ar,
          edu_countries!inner (
            name_ar
          )
        )
      ),
      edu_units (
        id,
        description,
        edu_lessons (
          id
        )
      )
    `)
    .eq("is_active", true)
    .order("order_no", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as SubjectRow[]).map(
    (subject: SubjectRow) => {
      const units = Array.isArray(subject.edu_units)
        ? subject.edu_units
        : Array.isArray(subject.units)
        ? subject.units
        : [];

      const lessonsCount = units.reduce(
        (total: number, unit: UnitRow) =>
          total +
          (Array.isArray(unit.edu_lessons)
            ? unit.edu_lessons.length
            : 0),
        0
      );

      return {
        id: subject.id,
        title: subject.name_ar ?? subject.title ?? "",
        description:
          units.find(
            (unit: UnitRow) => unit.description
          )?.description ?? null,
        icon: subject.icon ?? null,
        color: subject.color ?? null,
        grade: subject.edu_grades?.name_ar ?? null,
        curriculum:
          subject.edu_grades?.edu_curricula?.name_ar ?? null,
        country:
          subject.edu_grades?.edu_curricula?.edu_countries
            ?.name_ar ?? null,
        lessons_count: lessonsCount,
      };
    }
  );
}