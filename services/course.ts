import type { SupabaseClient } from "@supabase/supabase-js";

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
  supabase: SupabaseClient
): Promise<CourseSummary[]> {
  const { data, error } = await (supabase
    .from("edu_subjects") as any)
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

  return (data ?? []).map((subject: any) => {
    const units = Array.isArray(subject.edu_units)
      ? subject.edu_units
      : [];

    const lessonsCount = units.reduce(
      (total: number, unit: any) =>
        total +
        (Array.isArray(unit.edu_lessons)
          ? unit.edu_lessons.length
          : 0),
      0
    );

    return {
      id: subject.id,
      title: subject.name_ar,
      description:
        units.find((unit: any) => unit.description)?.description ??
        null,
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
  });
}
