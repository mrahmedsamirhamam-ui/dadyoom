import CurriculumCatalogClient from "./CurriculumCatalogClient";
import { getStudentCurriculumCatalog } from "@/services/lessons/student-curriculum-catalog";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage({ searchParams }: {
  searchParams: Promise<{ country?: string; grade?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let defaultCountryCode = "BH";
  let defaultGradeNumber: number | null = null;
  let defaultCurriculumMode: "ministry" | "dadyoom" = "ministry";

  if (user) {
    defaultCurriculumMode = user.user_metadata?.dadyoom_learning_preferences?.mode === "dadyoom" ? "dadyoom" : "ministry";
    const { data: profile } = await supabase
      .from("profiles")
      .select("country,grade_number")
      .eq("id", user.id)
      .maybeSingle();

    const country = String(profile?.country ?? "").trim().toUpperCase();
    if (country) defaultCountryCode = country === "BAHRAIN" || country === "البحرين" ? "BH" : country;
    if (typeof profile?.grade_number === "number" && profile.grade_number >= 1 && profile.grade_number <= 13) {
      defaultGradeNumber = profile.grade_number;
    }
  }

  // Shareable study links override the display selection only, never the user's saved profile.
  const countryCandidate = String(params.country ?? "").trim().toUpperCase();
  const gradeCandidate = Number(params.grade);
  if (/^[A-Z]{2}$/.test(countryCandidate)) defaultCountryCode = countryCandidate;
  if (Number.isInteger(gradeCandidate) && gradeCandidate >= 1 && gradeCandidate <= 12) {
    defaultGradeNumber = gradeCandidate;
  }

  return (
    <CurriculumCatalogClient
      units={await getStudentCurriculumCatalog()}
      defaultCountryCode={defaultCountryCode}
      defaultGradeNumber={defaultGradeNumber}
      defaultCurriculumMode={defaultCurriculumMode}
    />
  );
}
