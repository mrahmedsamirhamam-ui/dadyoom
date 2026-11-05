import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getArabicCountryOptions } from "@/lib/countries";
import StudyCountryGradePicker from "./StudyCountryGradePicker";

export const metadata: Metadata = {
  title: "ابدأ الدراسة",
  description: "اختر الدولة والصف مرة واحدة، ثم تابع دروس العربية في ضاديوم.",
};

export default async function StudyPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  let country = "";
  let grade: number | null = null;
  let resumeLessonId: string | null = null;
  if (user) {
    const { data: profile } = await db.from("profiles")
      .select("country,grade_number").eq("id", user.id).maybeSingle();
    country = profile?.country?.trim().toUpperCase() || "";
    const number = Number(profile?.grade_number);
    if (Number.isInteger(number) && number >= 1 && number <= 12) grade = number;

    const { data: progress } = await db.from("student_lesson_progress")
      .select("lesson_id").eq("student_id", user.id)
      .order("updated_at", { ascending: false }).limit(12);
    const ids = (progress ?? []).map(row => row.lesson_id).filter(Boolean);
    if (ids.length) {
      const { data: published } = await db.from("lessons")
        .select("id").in("id", ids).eq("status", "published");
      const allowed = new Set((published ?? []).map(item => item.id));
      resumeLessonId = ids.find(id => allowed.has(id)) ?? null;
    }
  }

  return (
    <StudyCountryGradePicker
      countries={getArabicCountryOptions()}
      initialCountry={country}
      initialGrade={grade}
      resumeLessonId={resumeLessonId}
      authenticated={Boolean(user)}
    />
  );
}
