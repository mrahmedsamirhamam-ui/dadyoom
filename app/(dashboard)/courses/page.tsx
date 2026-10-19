import CurriculumCatalogClient from "./CurriculumCatalogClient";
import { getStudentCurriculumCatalog } from "@/services/lessons/student-curriculum-catalog";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let defaultCountryCode = "BH";
  let defaultGradeNumber: number | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("country,grade_number")
      .eq("id", user.id)
      .maybeSingle();

    const country = String(profile?.country ?? "").trim().toUpperCase();
    if (country) defaultCountryCode = country === "BAHRAIN" || country === "البحرين" ? "BH" : country;
    if (typeof profile?.grade_number === "number" && profile.grade_number >= 1 && profile.grade_number <= 12) {
      defaultGradeNumber = profile.grade_number;
    }
  }

  return (
    <CurriculumCatalogClient
      units={await getStudentCurriculumCatalog()}
      defaultCountryCode={defaultCountryCode}
      defaultGradeNumber={defaultGradeNumber}
    />
  );
}
